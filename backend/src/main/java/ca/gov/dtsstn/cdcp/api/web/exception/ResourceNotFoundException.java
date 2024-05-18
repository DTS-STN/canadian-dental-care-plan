package ca.gov.dtsstn.cdcp.api.web.exception;

import org.springframework.core.NestedRuntimeException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@SuppressWarnings({ "serial" })
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends NestedRuntimeException {

	public ResourceNotFoundException(String message) {
		super(message);
	}

	public ResourceNotFoundException(String message, Throwable cause) {
		super(message, cause);
	}

}