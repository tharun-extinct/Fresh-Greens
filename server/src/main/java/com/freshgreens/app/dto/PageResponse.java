package com.freshgreens.app.dto;

import lombok.*;

import java.io.Serializable;
import java.util.List;

/**
 * Serializable wrapper for paginated results — safe for Redis caching
 * (Spring Data's PageImpl is NOT Serializable with JDK serialization).
 */
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PageResponse<T extends Serializable> implements Serializable {

    private static final long serialVersionUID = 1L;

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;
    private boolean first;
}
