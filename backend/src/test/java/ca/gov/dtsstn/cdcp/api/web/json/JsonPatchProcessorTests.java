package ca.gov.dtsstn.cdcp.api.web.json;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.validation.BindException;
import org.springframework.validation.Errors;
import org.springframework.validation.SmartValidator;

import jakarta.json.Json;
import jakarta.validation.constraints.NotBlank;

@ExtendWith({ MockitoExtension.class })
class JsonPatchProcessorTests {

	JsonPatchProcessor jsonPatchProcessor;

	@Mock SmartValidator validator;

	@BeforeEach
	void beforeEach() {
		this.jsonPatchProcessor = new JsonPatchProcessor(validator);
	}

	@Test
	@DisplayName("Test patch(..) w/ JSON merge patch")
	void testPatchJsonMergePatch() throws BindException{
		final var entity = new MyEntity("id", "name");
		final var patchObject = Json.createObjectBuilder().add("name", "updated name").build();
		final var jsonMergePatch = Json.createMergePatch(Json.createObjectBuilder(patchObject).build());
		final var patchedEntity = jsonPatchProcessor.patch(entity, jsonMergePatch);

		assertThat(patchedEntity)
			.isNotSameAs(entity)
			.hasFieldOrPropertyWithValue("id", "id")
			.hasFieldOrPropertyWithValue("name", "updated name");
	}

	@Test
	@DisplayName("Test patch(..) w/ invalid JSON merge patch")
	void testPatchJsonMergePatch_validationError_throws() {
		final var entity = new MyEntity("id", "name");
		final var patchObject = Json.createObjectBuilder().add("name", "").build();
		final var jsonMergePatch = Json.createMergePatch(Json.createObjectBuilder(patchObject).build());

		doAnswer(invocation -> {
			invocation.getArgument(1, Errors.class).reject("name", "name should not be blank");
			return null;
		}).when(validator).validate(any(), any());

		assertThatExceptionOfType(BindException.class)
			.isThrownBy(() -> jsonPatchProcessor.patch(entity, jsonMergePatch))
			.extracting(BindException::getAllErrors)
			.matches(errors -> errors.stream()
				.map(DefaultMessageSourceResolvable::getDefaultMessage)
				.anyMatch("name should not be blank"::equals));
	}

	@Test
	@DisplayName("Test patch(..) w/ JSON patch")
	void testPatchJsonPatch() throws BindException {
		final var entity = new MyEntity("id", "name");
		final var patchObject = Json.createObjectBuilder().add("op", "replace").add("path", "/name").add("value", "updated name").build();
		final var jsonPatch = Json.createPatch(Json.createArrayBuilder().add(patchObject).build());
		final var patchedEntity = jsonPatchProcessor.patch(entity, jsonPatch);

		assertThat(patchedEntity)
			.isNotSameAs(entity)
			.hasFieldOrPropertyWithValue("id", "id")
			.hasFieldOrPropertyWithValue("name", "updated name");
	}

	@Test
	@DisplayName("Test patch(..) w/ invalid JSON patch")
	void testPatchJsonPatch_validationError_throws() {
		final var entity = new MyEntity("id", "name");
		final var patchObject = Json.createObjectBuilder().add("op", "replace").add("path", "/name").add("value", "").build();
		final var jsonPatch = Json.createPatch(Json.createArrayBuilder().add(patchObject).build());

		doAnswer(invocation -> {
			invocation.getArgument(1, Errors.class).reject("name", "name should not be blank");
			return null;
		}).when(validator).validate(any(), any());

		assertThatExceptionOfType(BindException.class)
			.isThrownBy(() -> jsonPatchProcessor.patch(entity, jsonPatch))
			.extracting(BindException::getAllErrors)
			.matches(errors -> errors.stream()
				.map(DefaultMessageSourceResolvable::getDefaultMessage)
				.anyMatch("name should not be blank"::equals));
	}

	static class MyEntity {

		@NotBlank
		public String id;

		@NotBlank
		public String name;

		public MyEntity(String id, String name) {
			this.id = id;
			this.name = name;
		}

	}

}
