package com.novel.imPark.dto.sqldto;


import java.time.LocalDateTime;

import lombok.Data;

@Data
public class AdminRatingDto {

	private int adminRatingKey;
	private int InquiryResponseNumver;
	private String adminId;
	private String userId;
	private int adminRating;
	private String review;
	private LocalDateTime adminRatingCreatedAt;
	private LocalDateTime adminRatingUpdatedAt;
	
}
