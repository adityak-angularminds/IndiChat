package com.chat.message.dto;

import com.chat.receipt.entity.MessageReceipt;
import java.time.Instant;
import java.util.UUID;

public record MessageReceiptDto(
    UUID messageId,
    UUID userId,
    Instant deliveredAt,
    Instant readAt
) {
    public static MessageReceiptDto fromEntity(MessageReceipt receipt) {
        return new MessageReceiptDto(
            receipt.getId().getMessageId(),
            receipt.getId().getUserId(),
            receipt.getDeliveredAt(),
            receipt.getReadAt()
        );
    }
}
