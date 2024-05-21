package ca.gov.dtsstn.cdcp.api.web.exception;

import org.springframework.core.NestedRuntimeException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@SuppressWarnings({ "serial" })
@ResponseStatus(HttpStatus.CONFLICT)
public class ResourceConflictException extends NestedRuntimeException {

	public ResourceConflictException(String message) {
		super(message);
	}

	public ResourceConflictException(String message, Throwable cause) {
		super(message, cause);
	}

}