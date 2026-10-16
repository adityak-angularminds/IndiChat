package com.chat.message.dto;

import java.util.List;

public record MessageHistoryResponse(
    List<MessageDto> messages,
    boolean hasMore,
    String nextCursor
) {}
