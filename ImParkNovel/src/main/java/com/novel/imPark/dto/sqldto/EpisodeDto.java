package com.novel.imPark.dto.sqldto;


import java.time.LocalDateTime;

import com.novel.imPark.dto.eum.CategoryEnum;
import com.novel.imPark.dto.eum.StateEnum;

import lombok.Data;

@Data
public class EpisodeDto {

	private int episodeKey;
	private int novelKey;
	private int episode;
	private CategoryEnum category;
	private String episodetitle;
	private String episodeContent;
	private int episodeHit;
	private String AuthorNote;
	private StateEnum episodeState;
	private LocalDateTime novelCreatedAt;
	private LocalDateTime novelUpdatedAt;
	
}
