package com.novel.imPark.dto.sqldto;

import java.time.LocalDateTime;

import com.novel.imPark.dto.eum.AuthorityEnum;

import lombok.Data;

@Data
public class AdminDto {

	
	private String adminId;
	private String adminPw;
	private String adminNicname;
	private String profileImg;
	private int adminAuthority;
	private AuthorityEnum adminState;
	private LocalDateTime adminCreatedAt;
	private LocalDateTime adminUpdatedAt;
	
	
}
