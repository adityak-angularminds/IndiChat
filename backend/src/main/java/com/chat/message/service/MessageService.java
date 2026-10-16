package com.chat.message.service;

import com.chat.conversation.entity.Conversation;
import com.chat.conversation.entity.ConversationMember;
import com.chat.conversation.repository.ConversationMemberRepository;
import com.chat.conversation.repository.ConversationRepository;
import com.chat.message.dto.MessageDto;
import com.chat.message.dto.MessageHistoryResponse;
import com.chat.message.dto.MessageReceiptDto;
import com.chat.message.dto.SendMessageRequest;
import com.chat.message.entity.Message;
import com.chat.message.repository.MessageRepository;
import com.chat.presence.PresenceService;
import com.chat.receipt.entity.MessageReceipt;
import com.chat.receipt.repository.MessageReceiptRepository;
import com.chat.user.entity.User;
import com.chat.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository memberRepository;
    private final MessageReceiptRepository receiptRepository;
    private final UserRepository userRepository;
    private final PresenceService presenceService;

    public MessageService(
        MessageRepository messageRepository,
        ConversationRepository conversationRepository,
        ConversationMemberRepository memberRepository,
        MessageReceiptRepository receiptRepository,
        UserRepository userRepository,
        PresenceService presenceService
    ) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.memberRepository = memberRepository;
        this.receiptRepository = receiptRepository;
        this.userRepository = userRepository;
        this.presenceService = presenceService;
    }

    @Transactional
    public MessageDto sendMessage(SendMessageRequest req, UUID senderId) {
        Conversation conversation = conversationRepository.findById(req.conversationId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));

        if (!memberRepository.existsByIdConversationIdAndIdUserId(req.conversationId(), senderId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a member of this conversation");
        }

        // Check deduplication
        Optional<Message> existing = messageRepository.findBySenderIdAndClientMessageId(senderId, req.clientMessageId());
        if (existing.isPresent()) {
            return toDto(existing.get());
        }

        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sender not found"));

        Message message = new Message(
            conversation,
            sender,
            req.clientMessageId(),
            req.messageType() != null ? req.messageType() : "TEXT",
            req.content(),
            req.replyToId()
        );

        message = messageRepository.save(message);

        // Update conversation timestamp
        conversation.setUpdatedAt(Instant.now());
        conversationRepository.save(conversation);

        // Create pending receipts for all other members
        List<ConversationMember> members = memberRepository.findByIdConversationId(conversation.getId());
        List<MessageReceipt> receipts = new ArrayList<>();
        for (ConversationMember member : members) {
            if (!member.getUser().getId().equals(senderId)) {
                receipts.add(new MessageReceipt(message, member.getUser()));
            }
        }
        if (!receipts.isEmpty()) {
            receiptRepository.saveAll(receipts);
        }

        return toDto(message);
    }

    @Transactional(readOnly = true)
    public MessageHistoryResponse getMessageHistory(UUID conversationId, UUID currentUserId, Instant cursor, int limit) {
        if (!memberRepository.existsByIdConversationIdAndIdUserId(conversationId, currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a member of this conversation");
        }

        int queryLimit = Math.min(Math.max(limit, 1), 100);
        PageRequest pageRequest = PageRequest.of(0, queryLimit + 1);

        List<Message> messages;
        if (cursor != null) {
            messages = messageRepository.findByConversationIdAndCreatedAtBefore(conversationId, cursor, pageRequest);
        } else {
            messages = messageRepository.findLatestByConversationId(conversationId, pageRequest);
        }

        boolean hasMore = messages.size() > queryLimit;
        List<Message> content = hasMore ? messages.subList(0, queryLimit) : messages;

        // Return in chronological order (oldest to newest for chat UI)
        List<MessageDto> dtos = new ArrayList<>(content.stream().map(this::toDto).toList());
        Collections.reverse(dtos);

        String nextCursor = hasMore && !content.isEmpty() ?
            content.get(content.size() - 1).getCreatedAt().toString() : null;

        return new MessageHistoryResponse(dtos, hasMore, nextCursor);
    }

    @Transactional
    public MessageReceiptDto markDelivered(UUID messageId, UUID userId) {
        Message message = messageRepository.findById(messageId).orElse(null);
        if (message == null) return null;

        receiptRepository.markDelivered(messageId, userId, Instant.now());
        return receiptRepository.findByIdMessageIdAndIdUserId(messageId, userId)
            .map(MessageReceiptDto::fromEntity)
            .orElse(null);
    }

    @Transactional
    public MessageReceiptDto markRead(UUID messageId, UUID userId) {
        Message message = messageRepository.findById(messageId).orElse(null);
        if (message == null) return null;

        receiptRepository.markRead(messageId, userId, Instant.now());

        // Update last read message on member
        memberRepository.findByIdConversationIdAndIdUserId(message.getConversation().getId(), userId)
            .ifPresent(m -> {
                m.setLastReadMessageId(messageId);
                memberRepository.save(m);
            });

        return receiptRepository.findByIdMessageIdAndIdUserId(messageId, userId)
            .map(MessageReceiptDto::fromEntity)
            .orElse(null);
    }

    public MessageDto toDto(Message message) {
        List<MessageReceiptDto> receiptDtos = receiptRepository.findByIdMessageId(message.getId())
            .stream()
            .map(MessageReceiptDto::fromEntity)
            .toList();
        boolean senderOnline = presenceService.isUserOnline(message.getSender().getId());
        return MessageDto.fromEntity(message, receiptDtos, senderOnline);
    }
}
