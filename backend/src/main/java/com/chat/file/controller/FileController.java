package com.chat.file.controller;

import com.chat.file.dto.FileUploadResponse;
import com.chat.file.service.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/v1/files")
public class FileController {

    private final FileStorageService fileStorageService;

    public FileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> uploadFile(@RequestParam("file") MultipartFile file) {
        FileUploadResponse response = fileStorageService.storeFile(file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/download/{fileId}/{fileName:.+}")
    public ResponseEntity<Resource> downloadFileWithName(
        @PathVariable("fileId") String fileId,
        @PathVariable("fileName") String fileName,
        @RequestParam(value = "download", defaultValue = "false") boolean download
    ) {
        return serveResource(fileId, fileName, download);
    }

    @GetMapping("/{fileId}")
    public ResponseEntity<Resource> downloadFileById(
        @PathVariable("fileId") String fileId,
        @RequestParam(value = "download", defaultValue = "false") boolean download
    ) {
        String originalName = fileStorageService.getOriginalFilename(fileId);
        return serveResource(fileId, originalName, download);
    }

    private ResponseEntity<Resource> serveResource(String fileId, String fileName, boolean download) {
        Resource resource = fileStorageService.loadFileAsResource(fileId);

        MediaType mediaType = MediaTypeFactory.getMediaType(fileName)
            .orElse(MediaType.APPLICATION_OCTET_STREAM);

        String dispositionType = "inline";
        if (download) {
            dispositionType = "attachment";
        } else {
            // For executables, archives, spreadsheets, or octet-stream, default to attachment
            String type = mediaType.getType().toLowerCase();
            String subtype = mediaType.getSubtype().toLowerCase();
            if (type.equals("application") &&
                !subtype.contains("pdf") &&
                !subtype.contains("json") &&
                !subtype.contains("xml")) {
                dispositionType = "attachment";
            }
        }

        String encodedName = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20");

        return ResponseEntity.ok()
            .contentType(mediaType)
            .header(HttpHeaders.CONTENT_DISPOSITION, dispositionType + "; filename=\"" + fileName + "\"; filename*=UTF-8''" + encodedName)
            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
            .body(resource);
    }
}
