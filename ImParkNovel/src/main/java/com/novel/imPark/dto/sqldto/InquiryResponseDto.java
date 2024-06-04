package com.novel.imPark.dto.sqldto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class InquiryResponseDto {

	private int InquiryResponseNumver;
	private int inquiryNumber;
	private String adminId;
	private String inquiryResponseText;
	private LocalDateTime inquiryResponseCreatedAt;
	private LocalDateTime inquiryResponseUpdatedAt;
	
}
