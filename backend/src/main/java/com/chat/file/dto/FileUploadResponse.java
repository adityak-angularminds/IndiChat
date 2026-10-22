package com.chat.file.dto;

public record FileUploadResponse(
    String fileId,
    String fileName,
    String fileType,
    String mimeType,
    long fileSize,
    String fileUrl
) {}
