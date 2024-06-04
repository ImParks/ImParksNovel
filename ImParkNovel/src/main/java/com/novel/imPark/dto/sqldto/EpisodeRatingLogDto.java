package com.novel.imPark.dto.sqldto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class EpisodeRatingLogDto {
 
	private int episodeRatingLogKey; 
	private int episodeKey;
	private String userId;
	private int episodeRating;
	private LocalDateTime episodeCreatedAt;
	private LocalDateTime episodeUpdatedAt;
	
	
}
