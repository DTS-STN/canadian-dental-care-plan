package ca.gov.dtsstn.cdcp.api.web.json;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import jakarta.json.Json;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.constraints.NotBlank;

@ExtendWith({ MockitoExtension.class })
class JsonPatchProcessorTests {

	JsonPatchProcessor jsonPatchProcessor;

	@BeforeEach
	void beforeEach() {
		this.jsonPatchProcessor = new JsonPatchProcessor();
	}

	@Test
	@DisplayName("Test patch(..) w/ JSON merge patch")
	void testPatchJsonMergePatch() {
		final var entity = new MyEntity("id", "name");
		final var patchObject = Json.createObjectBuilder().add("name", "updated name").build();
		final var jsonMergePatch = Json.createMergePatch(Json.createObjectBuilder(patchObject).build());
		final var patchedEntity = jsonPatchProcessor.patch(entity, jsonMergePatch);

		assertThat(patchedEntity).isNotSameAs(entity);
		assertThat(patchedEntity).hasFieldOrPropertyWithValue("id", "id");
		assertThat(patchedEntity).hasFieldOrPropertyWithValue("name", "updated name");
	}

	@Test
	@DisplayName("Test patch(..) w/ invalid JSON merge patch")
	void testPatchJsonMergePatch_validationError_throws() {
		final var entity = new MyEntity("id", "name");
		final var patchObject = Json.createObjectBuilder().add("name", "").build();
		final var jsonMergePatch = Json.createMergePatch(Json.createObjectBuilder(patchObject).build());

		assertThatExceptionOfType(ConstraintViolationException.class)
			.isThrownBy(() -> jsonPatchProcessor.patch(entity, jsonMergePatch))
			.withMessage("name: must not be blank");
	}

	@Test
	@DisplayName("Test patch(..) w/ JSON patch")
	void testPatchJsonPatch() {
		final var entity = new MyEntity("id", "name");
		final var patchObject = Json.createObjectBuilder().add("op", "replace").add("path", "/name").add("value", "updated name").build();
		final var jsonPatch = Json.createPatch(Json.createArrayBuilder().add(patchObject).build());
		final var patchedEntity = jsonPatchProcessor.patch(entity, jsonPatch);

		assertThat(patchedEntity).isNotSameAs(entity);
		assertThat(patchedEntity).hasFieldOrPropertyWithValue("id", "id");
		assertThat(patchedEntity).hasFieldOrPropertyWithValue("name", "updated name");
	}

	@Test
	@DisplayName("Test patch(..) w/ invalid JSON patch")
	void testPatchJsonPatch_validationError_throws() {
		final var entity = new MyEntity("id", "name");
		final var patchObject = Json.createObjectBuilder().add("op", "replace").add("path", "/name").add("value", "").build();
		final var jsonPatch = Json.createPatch(Json.createArrayBuilder().add(patchObject).build());

		assertThatExceptionOfType(ConstraintViolationException.class)
			.isThrownBy(() -> jsonPatchProcessor.patch(entity, jsonPatch))
			.withMessage("name: must not be blank");
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
