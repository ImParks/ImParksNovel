package com.novel.imPark.dto.sqldto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class NovelCategoryDto {

	private int novelCategoryKey;
	private int categoryCollectKey;
	private int novelKey;
	private LocalDateTime categoryCollectCreatedAt;
	private LocalDateTime categoryCollectUpdatedAt;
	
}
