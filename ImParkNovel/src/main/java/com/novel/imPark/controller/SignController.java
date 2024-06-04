package com.novel.imPark.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.novel.imPark.dto.signDto.CreateIdDto;

import lombok.AllArgsConstructor;

@RequestMapping("/sign/*")
@AllArgsConstructor
@RestController
public class SignController {
	
	
	@GetMapping("/signIn")
	public String sign() {
		
		return "sign/signIn";
	}
	
	@PostMapping("/signInPoc")
	public String signInPrc(@RequestParam("userId") String userId,@RequestParam("userPw") String userPw) {
		
		// 아이디 비밀번호 조회
		
		
			
		
		
		
		return "";
	}
	
	@PostMapping("/signUp")
	public String signUp() {
		return "sign/signUp";
	}
	
	@GetMapping("/createId")
	public String createId(CreateIdDto createId) {
		
		return "sign/signIn";
	}
	
	@PostMapping("/subal")
	public String sublalls() {
		return "응가";
	}
	
}
