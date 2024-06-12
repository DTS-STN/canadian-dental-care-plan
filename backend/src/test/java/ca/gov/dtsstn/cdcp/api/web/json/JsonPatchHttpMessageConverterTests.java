package ca.gov.dtsstn.cdcp.api.web.json;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpOutputMessage;

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
	@DisplayName("Test readInternal(..)")
	void testReadInternal() throws Exception {
		final var httpInputMessage = mock(HttpInputMessage.class);

		when(httpInputMessage.getBody()).thenReturn(new ByteArrayInputStream("[{ \"op\":\"replace\", \"path\":\"/id\", \"value\":\"value\" }]".getBytes()));

		final var jsonObject = jsonPatchHttpMessageConverter.readInternal(JsonPatch.class, httpInputMessage).toJsonArray().get(0).asJsonObject();

		assertThat(jsonObject.getString("op")).isEqualTo("replace");
		assertThat(jsonObject.getString("path")).isEqualTo("/id");
		assertThat(jsonObject.getString("value")).isEqualTo("value");
	}

	@Test
	@DisplayName("Test writeInternal(..)")
	void testWriteInternal() throws Exception {
		final var httpOutputMessage = mock(HttpOutputMessage.class);
		final var byteArrayOutputStream = new ByteArrayOutputStream();

		when(httpOutputMessage.getBody()).thenReturn(byteArrayOutputStream);

		final var map = Map.of("op", "replace", "path", "/id", "value", "value");
		final var jsonPatchObject = Json.createArrayBuilder(List.of(map)).build();
		jsonPatchHttpMessageConverter.writeInternal(Json.createPatch(jsonPatchObject), httpOutputMessage);

		assertThat(byteArrayOutputStream).hasToString("[{\"op\":\"replace\",\"path\":\"/id\",\"value\":\"value\"}]");
	}

}
