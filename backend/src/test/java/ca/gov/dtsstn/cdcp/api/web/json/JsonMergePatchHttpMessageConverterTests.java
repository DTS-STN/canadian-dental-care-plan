package ca.gov.dtsstn.cdcp.api.web.json;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpOutputMessage;

import jakarta.json.Json;
import jakarta.json.JsonMergePatch;

@ExtendWith({ MockitoExtension.class })
class JsonMergePatchHttpMessageConverterTests {

	JsonMergePatchHttpMessageConverter jsonMergePatchHttpMessageConverter;

	@BeforeEach
	void beforeEach() throws Exception {
		this.jsonMergePatchHttpMessageConverter = new JsonMergePatchHttpMessageConverter();
	}

	@Test
	@DisplayName("Test supports(..)")
	void testSupportsClass() {
		assertThat(jsonMergePatchHttpMessageConverter.supports(JsonMergePatch.class)).isTrue();
		assertThat(jsonMergePatchHttpMessageConverter.supports(Object.class)).isFalse();
	}

	@Test
	@DisplayName("Test readInternal(..)")
	void testReadInternal() throws Exception {
		final var httpInputMessage = mock(HttpInputMessage.class);

		when(httpInputMessage.getBody()).thenReturn(new ByteArrayInputStream("{ \"key\":\"value\" }".getBytes()));

		final var jsonValue = jsonMergePatchHttpMessageConverter.readInternal(JsonMergePatch.class, httpInputMessage).toJsonValue();

		assertThat(jsonValue.asJsonObject().getString("key")).isEqualTo("value");
	}

	@Test
	@DisplayName("Test writeInternal(..)")
	void testWriteInternal() throws Exception {
		final var httpOutputMessage = mock(HttpOutputMessage.class);
		final var byteArrayOutputStream = new ByteArrayOutputStream();

		when(httpOutputMessage.getBody()).thenReturn(byteArrayOutputStream);

		final var jsonPatchObject = Json.createObjectBuilder(Map.of("key", "value")).build();
		jsonMergePatchHttpMessageConverter.writeInternal(Json.createMergePatch(jsonPatchObject), httpOutputMessage);

		assertThat(byteArrayOutputStream).hasToString("{\"key\":\"value\"}");
	}

}
