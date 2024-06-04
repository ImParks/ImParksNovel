package com.novel.imPark.dto.signDto;

import com.novel.imPark.dto.eum.GenderEnum;

import lombok.Data;

@Data
public class CreateIdDto {

	private String userId;
	private String userPw;
	private String userNicname;
	private int tag;
	private String profileImg;
	private String name;
	private GenderEnum gender;
	private String birthday;
	private String email;
	private String mobileNumver;
	private String pwHint;
	private String answer;
	
}
