package ca.gov.dtsstn.cdcp.api.web;

import java.net.URI;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import ca.gov.dtsstn.cdcp.api.web.exception.ResourceNotFoundException;

@RestControllerAdvice
public class ApiErrorHandler {

	@ExceptionHandler({ ResourceNotFoundException.class })
	public ErrorResponse handleResourceNotFoundException(ResourceNotFoundException exception) {
		return ErrorResponse.builder(exception, HttpStatus.NOT_FOUND, exception.getMessage())
			.type(URI.create("https://datatracker.ietf.org/doc/html/rfc7231#section-6.5.4"))
			.build();
	}

}
