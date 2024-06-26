package ca.gov.dtsstn.cdcp.api.web.json;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpOutputMessage;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.converter.HttpMessageNotWritableException;

import jakarta.json.Json;
import jakarta.json.JsonPatch;

@ExtendWith({ MockitoExtension.class })
class JsonPatchHttpMessageConverterTests {

	JsonPatchHttpMessageConverter jsonPatchHttpMessageConverter;

	@BeforeEach
	void beforeEach() {
		this.jsonPatchHttpMessageConverter = new JsonPatchHttpMessageConverter();
	}

	@Test
	@DisplayName("Test supports(..)")
	void testSupportsClass() {
		assertThat(jsonPatchHttpMessageConverter.supports(JsonPatch.class)).isTrue();
		assertThat(jsonPatchHttpMessageConverter.supports(Object.class)).isFalse();
	}

	@Test
	@DisplayName("Test readInternal(..) with flawed input")
	void testReadInternalWithFlawedInput() throws Exception {
		final var httpInputMessage = mock(HttpInputMessage.class);

		when(httpInputMessage.getBody()).thenThrow(new IOException("Something went wrong"));

		assertThrows(HttpMessageNotReadableException.class, () -> jsonPatchHttpMessageConverter.readInternal(JsonPatch.class, httpInputMessage));

	}

	@Test
	@DisplayName("Test readInternal(..) with valid input")
	void testReadInternalWithValidInput() throws Exception {
		final var httpInputMessage = mock(HttpInputMessage.class);

		when(httpInputMessage.getBody()).thenReturn(new ByteArrayInputStream("[{ \"op\":\"replace\", \"path\":\"/id\", \"value\":\"value\" }]".getBytes()));

		final var jsonObject = jsonPatchHttpMessageConverter.readInternal(JsonPatch.class, httpInputMessage).toJsonArray().get(0).asJsonObject();

		assertThat(jsonObject.getString("op")).isEqualTo("replace");
		assertThat(jsonObject.getString("path")).isEqualTo("/id");
		assertThat(jsonObject.getString("value")).isEqualTo("value");
	}

	@Test
	@DisplayName("Test writeInternal(..) with valid input")
	void testWriteInternalWithValidInput() throws Exception {
		final var httpOutputMessage = mock(HttpOutputMessage.class);
		final var byteArrayOutputStream = new ByteArrayOutputStream();

		when(httpOutputMessage.getBody()).thenReturn(byteArrayOutputStream);

		final var patchObject = Json.createPatchBuilder().replace("/op", "replace").build();

		jsonPatchHttpMessageConverter.writeInternal(patchObject, httpOutputMessage);

		assertThat(byteArrayOutputStream).hasToString("[{\"op\":\"replace\",\"path\":\"/op\",\"value\":\"replace\"}]");
	}

	@Test
	@DisplayName("Test writeInternal(..) with flawed input")
	void testWriteInternalWithFlawedInput() throws Exception {
		final var httpOutputMessage = mock(HttpOutputMessage.class);

		when(httpOutputMessage.getBody()).thenThrow(new IOException("Something went wrong"));

		final var patchObject = Json.createPatchBuilder().add("/op", "replace").add("/path", "/name").add("/value", "updated name").build();

		assertThrows(HttpMessageNotWritableException.class, () -> jsonPatchHttpMessageConverter.writeInternal(patchObject, httpOutputMessage));
	}

}
