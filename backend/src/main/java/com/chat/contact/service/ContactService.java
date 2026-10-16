package com.chat.contact.service;

import com.chat.contact.dto.ContactDto;
import com.chat.contact.entity.Contact;
import com.chat.contact.repository.ContactRepository;
import com.chat.presence.PresenceService;
import com.chat.user.dto.UserDto;
import com.chat.user.entity.User;
import com.chat.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class ContactService {

    private final ContactRepository contactRepository;
    private final UserRepository userRepository;
    private final PresenceService presenceService;

    public ContactService(ContactRepository contactRepository, UserRepository userRepository, PresenceService presenceService) {
        this.contactRepository = contactRepository;
        this.userRepository = userRepository;
        this.presenceService = presenceService;
    }

    @Transactional(readOnly = true)
    public List<ContactDto> getUserContacts(UUID userId) {
        List<Contact> contacts = contactRepository.findByIdUserId(userId);
        return contacts.stream().map(c -> {
            boolean online = presenceService.isUserOnline(c.getContactUser().getId());
            return new ContactDto(
                c.getContactUser().getId(),
                c.getNickname(),
                c.getCreatedAt(),
                UserDto.fromEntity(c.getContactUser(), online)
            );
        }).toList();
    }

    @Transactional
    public ContactDto addContact(UUID userId, UUID contactUserId, String nickname) {
        if (userId.equals(contactUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot add yourself as contact");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        User contactUser = userRepository.findById(contactUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact user not found"));

        Contact contact = new Contact(user, contactUser, nickname);
        contact = contactRepository.save(contact);

        boolean online = presenceService.isUserOnline(contactUserId);
        return new ContactDto(
            contactUserId,
            contact.getNickname(),
            contact.getCreatedAt(),
            UserDto.fromEntity(contactUser, online)
        );
    }
}
