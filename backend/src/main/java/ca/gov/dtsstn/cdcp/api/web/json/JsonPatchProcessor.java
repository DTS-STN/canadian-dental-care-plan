package ca.gov.dtsstn.cdcp.api.web.json;

import java.util.Map;
import java.util.function.Function;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.Assert;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.DirectFieldBindingResult;
import org.springframework.validation.SmartValidator;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.json.Json;
import jakarta.json.JsonMergePatch;
import jakarta.json.JsonPatch;
import jakarta.json.JsonStructure;
import jakarta.json.JsonValue;

@Component
public class JsonPatchProcessor {

	private static final Logger log = LoggerFactory.getLogger(JsonPatchProcessor.class);

	private final ObjectMapper objectMapper = new ObjectMapper()
		.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
		.findAndRegisterModules();

	private final SmartValidator validator;

	public JsonPatchProcessor(SmartValidator validator) {
		Assert.notNull(validator, "validator is required; it must not be null");
		this.validator = validator;
	}

	/**
	 * Applies a JSON merge patch to the specified object. The object is not modified by the patch.
	 *
	 * @param object the object to apply the JSON merge patch
	 * @param jsonMergePatch the JSON merge patch to apply
	 * @return the transformed object after the patch
	 */
	public <T> T patch(T object, JsonMergePatch jsonMergePatch) throws BindException {
		return patch(object, jsonMergePatch::apply);
	}

	/**
	 * Applies JSON patch operations to the specified object. The object is not modified by the patch.
	 *
	 * @param object the object to apply the JSON patch
	 * @param jsonPatch the JSON patch to apply
	 * @return the transformed target after the patch
	 */
	public <T> T patch(T object, JsonPatch jsonPatch) throws BindException{
		return patch(object, jsonPatch::apply);
	}

	@SuppressWarnings({ "unchecked" })
	protected <T> T patch(T object, Function<? super JsonStructure, ? extends JsonValue> patchFn) throws BindException {
		Assert.notNull(object, "object is required; it must not be null");
		Assert.notNull(patchFn, "patchFn is required; it must not be null");

		try {
			log.debug("Patching object of type {}", object.getClass().getSimpleName());
			final var valueMap = objectMapper.convertValue(object, Map.class);
			final var jsonObject = Json.createObjectBuilder(valueMap).build();
			final var patchedObject = objectMapper.readValue(patchFn.apply(jsonObject).toString(), object.getClass());

			log.debug("Performing JSON patch validation");
			final var bindingResult = validateObject(patchedObject);
			if (bindingResult.hasErrors()) { throw new BindException(bindingResult); }
			log.debug("No validation errors for {}", object.getClass().getSimpleName());

			return (T) patchedObject;
		}
		catch (final JsonProcessingException jsonProcessingException) {
			throw new RuntimeException(jsonProcessingException);
		}
	}

	protected BindingResult validateObject(Object object) {
		Assert.notNull(object, "object is required; it must not be null");
		final var bindingResult = new DirectFieldBindingResult(object, "patch");
		validator.validate(object, bindingResult);
		return bindingResult;
	}

}
