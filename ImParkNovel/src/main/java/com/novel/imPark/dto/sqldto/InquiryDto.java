package com.novel.imPark.dto.sqldto;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class InquiryDto {

	private int inquiryNumber;
	private String userId;
	private String inquiryCategory;
	private String inquiryText;
	private LocalDateTime inquiryCreatedAt;
	private LocalDateTime inquiryUpdatedAt;
	
}
