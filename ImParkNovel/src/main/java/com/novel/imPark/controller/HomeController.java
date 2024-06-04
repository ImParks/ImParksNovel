package com.novel.imPark.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;


@RequestMapping("/api")
@RestController
public class HomeController {

	
@GetMapping("/aa")
@ResponseBody
public String MainHome() {
	// 로그인 확인필요
	
	
    return "home";
}

	
	
}
