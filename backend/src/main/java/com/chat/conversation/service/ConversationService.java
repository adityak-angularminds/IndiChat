package com.chat.conversation.service;

import com.chat.conversation.dto.ConversationDto;
import com.chat.conversation.dto.ConversationMemberDto;
import com.chat.conversation.dto.CreateConversationRequest;
import com.chat.conversation.entity.Conversation;
import com.chat.conversation.entity.ConversationMember;
import com.chat.conversation.repository.ConversationMemberRepository;
import com.chat.conversation.repository.ConversationRepository;
import com.chat.message.dto.MessageDto;
import com.chat.message.entity.Message;
import com.chat.message.repository.MessageRepository;
import com.chat.message.service.MessageService;
import com.chat.presence.PresenceService;
import com.chat.user.entity.User;
import com.chat.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;

@Service
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final MessageService messageService;
    private final PresenceService presenceService;

    public ConversationService(
        ConversationRepository conversationRepository,
        ConversationMemberRepository memberRepository,
        UserRepository userRepository,
        MessageRepository messageRepository,
        MessageService messageService,
        PresenceService presenceService
    ) {
        this.conversationRepository = conversationRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.messageRepository = messageRepository;
        this.messageService = messageService;
        this.presenceService = presenceService;
    }

    @Transactional(readOnly = true)
    public List<ConversationDto> getUserConversations(UUID userId) {
        List<Conversation> conversations = conversationRepository.findConversationsByUserId(userId);
        return conversations.stream().map(c -> toDto(c, userId)).toList();
    }

    @Transactional(readOnly = true)
    public ConversationDto getConversation(UUID conversationId, UUID userId) {
        if (!memberRepository.existsByIdConversationIdAndIdUserId(conversationId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a member of this conversation");
        }
        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
        return toDto(conversation, userId);
    }

    @Transactional
    public ConversationDto createConversation(CreateConversationRequest req, UUID creatorId) {
        String type = req.type().toUpperCase();

        // Direct conversation idempotency check
        if ("DIRECT".equals(type)) {
            if (req.participantIds().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Direct chat requires 1 participant");
            }
            UUID targetUserId = req.participantIds().get(0);
            if (targetUserId.equals(creatorId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot start direct chat with yourself");
            }

            Optional<Conversation> existing = conversationRepository.findDirectConversationBetween(creatorId, targetUserId);
            if (existing.isPresent()) {
                return toDto(existing.get(), creatorId);
            }
        }

        Conversation conversation = new Conversation(type, req.title(), creatorId);
        conversation = conversationRepository.save(conversation);

        User creator = userRepository.findById(creatorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Creator not found"));

        ConversationMember creatorMember = new ConversationMember(conversation, creator, "ADMIN");
        memberRepository.save(creatorMember);

        // Add other participants
        Set<UUID> added = new HashSet<>();
        added.add(creatorId);

        for (UUID participantId : req.participantIds()) {
            if (added.contains(participantId)) continue;
            User participant = userRepository.findById(participantId).orElse(null);
            if (participant != null) {
                ConversationMember member = new ConversationMember(conversation, participant, "MEMBER");
                memberRepository.save(member);
                added.add(participantId);
            }
        }

        return toDto(conversation, creatorId);
    }

    public ConversationDto toDto(Conversation conversation, UUID currentUserId) {
        List<ConversationMember> members = memberRepository.findByIdConversationId(conversation.getId());
        List<ConversationMemberDto> memberDtos = members.stream()
            .map(m -> ConversationMemberDto.fromEntity(m, presenceService.isUserOnline(m.getUser().getId())))
            .toList();

        // Latest message
        Optional<Message> latest = messageRepository.findTopByConversationIdOrderByCreatedAtDesc(conversation.getId());
        MessageDto lastMessageDto = latest.map(messageService::toDto).orElse(null);

        // Unread count
        ConversationMember currentMember = members.stream()
            .filter(m -> m.getUser().getId().equals(currentUserId))
            .findFirst()
            .orElse(null);

        long unreadCount = 0;
        if (currentMember != null) {
            Instant lastReadTime = null;
            if (currentMember.getLastReadMessageId() != null) {
                lastReadTime = messageRepository.findById(currentMember.getLastReadMessageId())
                    .map(Message::getCreatedAt)
                    .orElse(null);
            }
            if (lastReadTime != null) {
                unreadCount = messageRepository.countUnreadAfter(conversation.getId(), currentUserId, lastReadTime);
            } else {
                unreadCount = messageRepository.countAllIncoming(conversation.getId(), currentUserId);
            }
        }

        return new ConversationDto(
            conversation.getId(),
            conversation.getType(),
            conversation.getTitle(),
            conversation.getCreatedBy(),
            conversation.getCreatedAt(),
            conversation.getUpdatedAt(),
            memberDtos,
            lastMessageDto,
            unreadCount
        );
    }
}
