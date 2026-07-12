package com.example.booking.dto;

import com.example.booking.domain.ResourceStatus;
import lombok.Data;

@Data
public class ResourceStatusUpdateRequest {
    private ResourceStatus status;
}
