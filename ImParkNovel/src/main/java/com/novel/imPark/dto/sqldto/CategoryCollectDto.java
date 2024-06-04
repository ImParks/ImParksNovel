package com.novel.imPark.dto.sqldto;


import java.time.LocalDateTime;

import lombok.Data;

@Data
public class CategoryCollectDto {

	private int categoryCollectKey;
	private String category;
	private String categoryChoseong;
 	private LocalDateTime categoryCollectCreatedAt;
	private LocalDateTime categoryCollectUpdatedAt;
	
}
