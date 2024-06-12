package ca.gov.dtsstn.cdcp.api.web.json;

import java.io.IOException;

import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpOutputMessage;
import org.springframework.http.MediaType;
import org.springframework.http.converter.AbstractHttpMessageConverter;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.converter.HttpMessageNotWritableException;
import org.springframework.stereotype.Component;

import jakarta.json.Json;
import jakarta.json.JsonPatch;

@Component
public class JsonPatchHttpMessageConverter extends AbstractHttpMessageConverter<JsonPatch> {

	public JsonPatchHttpMessageConverter() {
		super(MediaType.APPLICATION_JSON, JsonPatchMediaTypes.JSON_PATCH);
	}

	@Override
	protected boolean supports(Class<?> clazz) {
		return JsonPatch.class.isAssignableFrom(clazz);
	}

	@Override
	protected JsonPatch readInternal(Class<? extends JsonPatch> clazz, HttpInputMessage httpInputMessage) throws IOException, HttpMessageNotReadableException {
		try {
			return Json.createPatch(Json.createReader(httpInputMessage.getBody()).readArray());
		}
		catch (final Exception exception) {
			final var message = "Could not read JSON patch: %s".formatted(exception.getMessage());
			throw new HttpMessageNotReadableException(message, exception, httpInputMessage);
		}
	}

	@Override
	protected void writeInternal(JsonPatch jsonPatch, HttpOutputMessage httpOutputMessage) {
		try {
			Json.createWriter(httpOutputMessage.getBody()).write(jsonPatch.toJsonArray());
		}
		catch (final Exception exception) {
			final var message = "Could not write JSON patch: %s".formatted(exception.getMessage());
			throw new HttpMessageNotWritableException(message, exception);
		}
	}

}
