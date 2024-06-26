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
import jakarta.json.JsonMergePatch;

@Component
public class JsonMergePatchHttpMessageConverter extends AbstractHttpMessageConverter<JsonMergePatch> {

	public JsonMergePatchHttpMessageConverter() {
		super(MediaType.APPLICATION_JSON, JsonPatchMediaTypes.JSON_MERGE_PATCH);
	}

	@Override
	protected boolean supports(Class<?> clazz) {
		return JsonMergePatch.class.isAssignableFrom(clazz);
	}

	@Override
	protected JsonMergePatch readInternal(Class<? extends JsonMergePatch> clazz, HttpInputMessage httpInputMessage) throws IOException, HttpMessageNotReadableException {
		try (final var jsonReader = Json.createReader(httpInputMessage.getBody())) {
			return Json.createMergePatch(jsonReader.readValue());
		}
		catch (final Exception exception) {
			final var message = "Could not read JSON merge-patch: %s".formatted(exception.getMessage());
			throw new HttpMessageNotReadableException(message, exception, httpInputMessage);
		}
	}

	@Override
	protected void writeInternal(JsonMergePatch jsonMergePatch, HttpOutputMessage httpOutputMessage) throws IOException, HttpMessageNotWritableException {
		try (final var jsonWriter = Json.createWriter(httpOutputMessage.getBody())){
			jsonWriter.write(jsonMergePatch.toJsonValue());
		}
		catch (final Exception exception) {
			final var message = "Could not write JSON merge-patch: %s".formatted(exception.getMessage());
			throw new HttpMessageNotWritableException(message, exception);
		}
	}

}
