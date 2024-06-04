package com.novel.imPark.dto.sqldto;


import java.time.LocalDateTime;

import lombok.Data;

@Data
public class FavoritesDto {
	private int favoritesKey;
	private int episodeKey;
	private int novelKey;
	private String userId; 
	private int episode;
	private LocalDateTime favoritesCreatedAt;
	private LocalDateTime favoritesUpdatedAt;
}
