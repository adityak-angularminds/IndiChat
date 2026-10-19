package com.chat.file.service;

import com.chat.file.dto.FileUploadResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.Optional;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootLocation);
            log.info("File storage initialized at: {}", this.rootLocation);
        } catch (IOException e) {
            log.error("Could not initialize storage directory", e);
            throw new RuntimeException("Could not initialize storage directory", e);
        }
    }

    public FileUploadResponse storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot upload empty file");
        }

        String originalFilename = StringUtils.cleanPath(
            file.getOriginalFilename() != null ? file.getOriginalFilename() : "file"
        );

        // Remove path traversal sequences
        originalFilename = Paths.get(originalFilename).getFileName().toString();
        if (originalFilename.isBlank()) {
            originalFilename = "unnamed_file";
        }

        String fileId = UUID.randomUUID().toString();
        String storedFilename = fileId + "_" + originalFilename;

        try {
            Path destinationFile = this.rootLocation.resolve(storedFilename).normalize().toAbsolutePath();
            if (!destinationFile.getParent().equals(this.rootLocation.toAbsolutePath())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            }

            String mimeType = file.getContentType();
            if (mimeType == null || mimeType.isBlank() || mimeType.equals("application/octet-stream")) {
                Optional<MediaType> mediaType = MediaTypeFactory.getMediaType(originalFilename);
                mimeType = mediaType.map(MediaType::toString).orElse("application/octet-stream");
            }

            String fileType = determineFileType(mimeType, originalFilename);
            String fileUrl = "/api/v1/files/download/" + fileId + "/" + originalFilename;

            log.info("Stored file id={} name={} type={} size={}", fileId, originalFilename, fileType, file.getSize());

            return new FileUploadResponse(
                fileId,
                originalFilename,
                fileType,
                mimeType,
                file.getSize(),
                fileUrl
            );
        } catch (IOException e) {
            log.error("Failed to store file {}", originalFilename, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store file", e);
        }
    }

    public Resource loadFileAsResource(String fileId) {
        try {
            // Find file starting with fileId_
            try (var stream = Files.list(this.rootLocation)) {
                Path match = stream
                    .filter(path -> path.getFileName().toString().startsWith(fileId + "_"))
                    .findFirst()
                    .orElse(null);

                if (match == null) {
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
                }

                Resource resource = new UrlResource(match.toUri());
                if (resource.exists() && resource.isReadable()) {
                    return resource;
                } else {
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File unreadable or missing");
                }
            }
        } catch (MalformedURLException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Malformed URL", e);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error reading file", e);
        }
    }

    public String getOriginalFilename(String fileId) {
        try (var stream = Files.list(this.rootLocation)) {
            Path match = stream
                .filter(path -> path.getFileName().toString().startsWith(fileId + "_"))
                .findFirst()
                .orElse(null);

            if (match != null) {
                String full = match.getFileName().toString();
                if (full.length() > 37) {
                    return full.substring(37);
                }
                return full;
            }
        } catch (IOException ignored) {}
        return "file";
    }

    public String determineFileType(String mimeType, String filename) {
        String lowerMime = mimeType != null ? mimeType.toLowerCase() : "";
        String lowerName = filename != null ? filename.toLowerCase() : "";

        if (lowerMime.startsWith("image/") || lowerName.matches(".*\\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|heic|avif)$")) {
            return "IMAGE";
        }
        if (lowerMime.startsWith("video/") || lowerName.matches(".*\\.(mp4|webm|mkv|mov|avi|wmv|flv|3gp|m4v)$")) {
            return "VIDEO";
        }
        if (lowerMime.startsWith("audio/") || lowerName.matches(".*\\.(mp3|wav|ogg|m4a|aac|flac|opus|weba)$")) {
            return "AUDIO";
        }
        return "DOCUMENT";
    }
}
