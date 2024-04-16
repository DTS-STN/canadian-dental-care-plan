package ca.gov.dtsstn.cdcp.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SampleController {

	@GetMapping("/samples")
	public String getSamples() {
		return "Hello world!";
	}

}
