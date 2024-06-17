package ca.gov.dtsstn.cdcp.api.web.v1.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.InstanceOfAssertFactories.list;
import static org.assertj.core.api.InstanceOfAssertFactories.type;
import static org.hamcrest.CoreMatchers.is;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Import;
import org.springframework.hateoas.MediaTypes;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import com.fasterxml.jackson.databind.ObjectMapper;

import ca.gov.dtsstn.cdcp.api.config.WebSecurityConfig;
import ca.gov.dtsstn.cdcp.api.service.AlertTypeService;
import ca.gov.dtsstn.cdcp.api.service.LanguageService;
import ca.gov.dtsstn.cdcp.api.service.UserService;
import ca.gov.dtsstn.cdcp.api.service.domain.ImmutableAlertType;
import ca.gov.dtsstn.cdcp.api.service.domain.ImmutableLanguage;
import ca.gov.dtsstn.cdcp.api.service.domain.ImmutableSubscription;
import ca.gov.dtsstn.cdcp.api.service.domain.ImmutableUser;
import ca.gov.dtsstn.cdcp.api.web.exception.ResourceConflictException;
import ca.gov.dtsstn.cdcp.api.web.exception.ResourceNotFoundException;
import ca.gov.dtsstn.cdcp.api.web.json.JsonPatchMediaTypes;
import ca.gov.dtsstn.cdcp.api.web.v1.model.ImmutableSubscriptionCreateModel;
import jakarta.json.Json;

@ActiveProfiles("test")
@Import({ WebSecurityConfig.class })
@WebMvcTest({ SubscriptionsController.class })
@ComponentScan({ "ca.gov.dtsstn.cdcp.api.web.json" })
@ComponentScan({ "ca.gov.dtsstn.cdcp.api.web.validation" })
class SubscriptionsControllerIT {

	@MockBean AlertTypeService alertTypeService;

	@MockBean LanguageService languageService;

	@MockBean UserService userService;

	@Autowired MockMvc mockMvc;

	final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

	@Test
	@WithMockUser(roles = { "Users.Administer" })
	@DisplayName("Test authenticated GET /api/v1/users/{userId}/subscriptions")
	void testGetSubscriptionsByUserId_HappyPath() throws Exception {
		final var mockUser = ImmutableUser.builder()
			.id("00000000-0000-0000-0000-000000000000")
			.addSubscriptions(ImmutableSubscription.builder()
				.id("00000000-0000-0000-0000-000000000000")
				.alertType(ImmutableAlertType.builder()
					.code("ALERT_TYPE_CODE")
					.build())
				.language(ImmutableLanguage.builder()
					.msLocaleCode("MS_LOCALE_CODE")
					.build())
				.build())
			.build();

		when(userService.getUserById("00000000-0000-0000-0000-000000000000")).thenReturn(Optional.of(mockUser));

		mockMvc.perform(get("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions"))
			.andDo(print())
			.andExpect(status().isOk())
			.andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaTypes.HAL_JSON_VALUE))
			.andExpect(jsonPath("$._embedded.subscriptions[0].id", is("00000000-0000-0000-0000-000000000000")))
			.andExpect(jsonPath("$._embedded.subscriptions[0].alertTypeCode", is("ALERT_TYPE_CODE")))
			.andExpect(jsonPath("$._embedded.subscriptions[0].msLanguageCode", is("MS_LOCALE_CODE")));
	}

	@Test
	@WithMockUser(roles = { "Users.Administer" })
	@DisplayName("Test authenticated GET /api/v1/users/{userId}/subscriptions w/ invalid user")
	void testGetSubscriptionsByUserId_InvalidUser() throws Exception {
		mockMvc.perform(get("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions"))
			.andDo(print())
			.andExpect(status().isNotFound())
			.andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PROBLEM_JSON_VALUE))
			.andExpect(result -> assertThat(result)
				.extracting(MvcResult::getResolvedException, type(ResourceNotFoundException.class))
				.extracting(ResourceNotFoundException::getMessage)
				.isEqualTo("No user with id=[00000000-0000-0000-0000-000000000000] was found"));
	}

	@Test
	@WithAnonymousUser
	@DisplayName("Test unauthenticated GET /api/v1/users/{userId}/subscriptions")
	void testGetSubscriptionsByUserId_Unauthorized() throws Exception {
		mockMvc.perform(get("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions"))
			.andDo(print())
			.andExpect(status().isUnauthorized());
	}

	@Test
	@WithMockUser(roles = { /* intentionally left blank */ })
	@DisplayName("Test insufficient privilege GET /api/v1/users/{userId}/subscriptions")
	void testGetSubscriptionsByUserId_Forbidden() throws Exception {
		mockMvc.perform(get("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions"))
			.andDo(print())
			.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(roles = { "Users.Administer" })
	@DisplayName("Test authenticated GET /api/v1/users/{userId}/subscriptions/{subscriptionId}")
	void testGetSubscriptionById_HappyPath() throws Exception {
		final var mockUser = ImmutableUser.builder()
			.id("00000000-0000-0000-0000-000000000000")
			.addSubscriptions(ImmutableSubscription.builder()
				.id("00000000-0000-0000-0000-000000000000")
				.alertType(ImmutableAlertType.builder()
					.code("ALERT_TYPE_CODE")
					.build())
				.language(ImmutableLanguage.builder()
					.msLocaleCode("MS_LOCALE_CODE")
					.build())
				.build())
			.build();

		when(userService.getUserById("00000000-0000-0000-0000-000000000000")).thenReturn(Optional.of(mockUser));

		mockMvc.perform(get("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions/00000000-0000-0000-0000-000000000000"))
			.andDo(print())
			.andExpect(status().isOk())
			.andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaTypes.HAL_JSON_VALUE))
			.andExpect(jsonPath("$.id", is("00000000-0000-0000-0000-000000000000")))
			.andExpect(jsonPath("$.alertTypeCode", is("ALERT_TYPE_CODE")))
			.andExpect(jsonPath("$.msLanguageCode", is("MS_LOCALE_CODE")))
			.andExpect(jsonPath("$._links.self.href", is("http://localhost/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions/00000000-0000-0000-0000-000000000000")));
	}

	@Test
	@WithMockUser(roles = { "Users.Administer" })
	@DisplayName("Test authenticated GET /api/v1/users/{userId}/subscriptions/{subscriptionId} w/ invalid user")
	void testGetSubscriptionById_InvalidUser() throws Exception {
		mockMvc.perform(get("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions/00000000-0000-0000-0000-000000000000"))
			.andDo(print())
			.andExpect(status().isNotFound())
			.andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PROBLEM_JSON_VALUE))
			.andExpect(result -> assertThat(result)
				.extracting(MvcResult::getResolvedException, type(ResourceNotFoundException.class))
				.extracting(ResourceNotFoundException::getMessage)
				.isEqualTo("No user with id=[00000000-0000-0000-0000-000000000000] was found"));
	}

	@Test
	@WithMockUser(roles = { "Users.Administer" })
	@DisplayName("Test authenticated GET /api/v1/users/{userId}/subscriptions/{subscriptionId} w/ invalid subscription")
	void testGetSubscriptionById_InvalidSubscription() throws Exception {
		final var mockUser = ImmutableUser.builder()
			.id("00000000-0000-0000-0000-000000000000")
			.build();

		when(userService.getUserById("00000000-0000-0000-0000-000000000000")).thenReturn(Optional.of(mockUser));

		mockMvc.perform(get("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions/00000000-0000-0000-0000-000000000000"))
			.andDo(print())
			.andExpect(status().isNotFound())
			.andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PROBLEM_JSON_VALUE))
			.andExpect(result -> assertThat(result)
				.extracting(MvcResult::getResolvedException, type(ResourceNotFoundException.class))
				.extracting(ResourceNotFoundException::getMessage)
				.isEqualTo("No subscription with id=[00000000-0000-0000-0000-000000000000] was found"));
	}

	@Test
	@WithAnonymousUser
	@DisplayName("Test unauthenticated GET /api/v1/users/{userId}/subscriptions/{subscriptionId}")
	void testGetSubscriptionById_Unauthorized() throws Exception {
		mockMvc.perform(get("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions"))
			.andDo(print())
			.andExpect(status().isUnauthorized());
	}

	@Test
	@WithMockUser(roles = { /* intentionally left blank */ })
	@DisplayName("Test insufficient privilege GET /api/v1/users/{userId}/subscriptions/{subscriptionId}")
	void testGetSubscriptionById_Forbidden() throws Exception {
		mockMvc.perform(get("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions"))
			.andDo(print())
			.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(roles = { "Users.Administer" })
	@DisplayName("Test authenticated POST /api/v1/users/{userId}/subscriptions")
	void testCreateSubscriptionForUser_HappyPath() throws Exception {
		final var mockAlertType = ImmutableAlertType.builder()
			.id("00000000-0000-0000-0000-000000000000")
			.build();

		final var mockLanguage = ImmutableLanguage.builder()
			.id("00000000-0000-0000-0000-000000000000")
			.build();

		final var mockUser = ImmutableUser.builder()
			.id("00000000-0000-0000-0000-000000000000")
			.build();

		when(alertTypeService.readByCode("ALERT_TYPE_CODE")).thenReturn(Optional.of(mockAlertType));
		when(languageService.readByMsLocaleCode("LANGUAGE_CODE")).thenReturn(Optional.of(mockLanguage));
		when(userService.getUserById("00000000-0000-0000-0000-000000000000")).thenReturn(Optional.of(mockUser));

		mockMvc.perform(post("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(ImmutableSubscriptionCreateModel.builder()
					.alertTypeCode("ALERT_TYPE_CODE")
					.msLanguageCode("LANGUAGE_CODE")
					.build())))
			.andDo(print())
			.andExpect(status().isNoContent());
	}

	@Test
	@WithMockUser(roles = { "Users.Administer" })
	@DisplayName("Test authenticated POST /api/v1/users/{userId}/subscriptions")
	void testCreateSubscriptionForUser_AlreadyExists() throws Exception {
		final var mockAlertType = ImmutableAlertType.builder()
			.id("00000000-0000-0000-0000-000000000000")
			.build();

		final var mockLanguage = ImmutableLanguage.builder()
			.id("00000000-0000-0000-0000-000000000000")
			.build();

		final var mockUser = ImmutableUser.builder()
			.id("00000000-0000-0000-0000-000000000000")
			.addSubscriptions(ImmutableSubscription.builder()
				.alertType(mockAlertType)
				.language(mockLanguage)
				.build())
			.build();

		when(alertTypeService.readByCode("ALERT_TYPE_CODE")).thenReturn(Optional.of(mockAlertType));
		when(languageService.readByMsLocaleCode("LANGUAGE_CODE")).thenReturn(Optional.of(mockLanguage));
		when(userService.getUserById("00000000-0000-0000-0000-000000000000")).thenReturn(Optional.of(mockUser));

		mockMvc.perform(post("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(ImmutableSubscriptionCreateModel.builder()
					.alertTypeCode("ALERT_TYPE_CODE")
					.msLanguageCode("LANGUAGE_CODE")
					.build())))
			.andDo(print())
			.andExpect(status().isConflict())
			.andExpect(result -> assertThat(result)
				.extracting(MvcResult::getResolvedException, type(ResourceConflictException.class))
				.extracting(ResourceConflictException::getMessage)
				.isEqualTo("A subscription with code [ALERT_TYPE_CODE] already exists for user [00000000-0000-0000-0000-000000000000]"));
	}

	@Test
	@WithMockUser(roles = { "Users.Administer" })
	@DisplayName("Test authenticated POST /api/v1/users/{userId}/subscriptions w/ invalid user")
	void testCreateSubscriptionForUser_InvalidUser() throws Exception {
		final var mockAlertType = ImmutableAlertType.builder()
			.id("00000000-0000-0000-0000-000000000000")
			.build();

		final var mockLanguage = ImmutableLanguage.builder()
			.id("00000000-0000-0000-0000-000000000000")
			.build();

		when(alertTypeService.readByCode("ALERT_TYPE_CODE")).thenReturn(Optional.of(mockAlertType));
		when(languageService.readByMsLocaleCode("LANGUAGE_CODE")).thenReturn(Optional.of(mockLanguage));

		mockMvc.perform(post("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(ImmutableSubscriptionCreateModel.builder()
					.alertTypeCode("ALERT_TYPE_CODE")
					.msLanguageCode("LANGUAGE_CODE")
					.build())))
			.andDo(print())
			.andExpect(status().isNotFound())
			.andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PROBLEM_JSON_VALUE))
			.andExpect(result -> assertThat(result)
				.extracting(MvcResult::getResolvedException, type(ResourceNotFoundException.class))
				.extracting(ResourceNotFoundException::getMessage)
				.isEqualTo("No user with id=[00000000-0000-0000-0000-000000000000] was found"));
	}

	@Test
	@WithMockUser(roles = { "Users.Administer" })
	@DisplayName("Test authenticated POST /api/v1/users/{userId}/subscriptions w/ invalid alert type")
	void testCreateSubscriptionForUser_InvalidAlertType() throws Exception {
		mockMvc.perform(post("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(ImmutableSubscriptionCreateModel.builder()
					.alertTypeCode("UNKNOWN_ALERT_TYPE_CODE")
					.msLanguageCode("DONT_CARE")
					.build())))
			.andDo(print())
			.andExpect(status().isBadRequest())
			.andExpect(result -> assertThat(result)
				.extracting(MvcResult::getResolvedException, type(MethodArgumentNotValidException.class))
				.extracting(MethodArgumentNotValidException::getAllErrors, list(ObjectError.class))
				.extracting(ObjectError::getDefaultMessage)
				.contains("Alert type code does not exist"));
	}

	@Test
	@WithMockUser(roles = { "Users.Administer" })
	@DisplayName("Test authenticated POST /api/v1/users/{userId}/subscriptions w/ invalid language")
	void testCreateSubscriptionForUser_InvalidLanguage() throws Exception {
		mockMvc.perform(post("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(ImmutableSubscriptionCreateModel.builder()
					.alertTypeCode("DONT_CARE")
					.msLanguageCode("UNKNOWN_LANGUAGE_CODE")
					.build())))
			.andDo(print())
			.andExpect(status().isBadRequest())
			.andExpect(result -> assertThat(result)
				.extracting(MvcResult::getResolvedException, type(MethodArgumentNotValidException.class))
				.extracting(MethodArgumentNotValidException::getAllErrors, list(ObjectError.class))
				.extracting(ObjectError::getDefaultMessage)
				.contains("Preferred language code does not exist"));
	}

	@Test
	@WithAnonymousUser
	@DisplayName("Test unauthenticated POST /api/v1/users/{userId}/subscriptions")
	void testCreateSubscriptionForUser_Unauthorized() throws Exception {
		mockMvc.perform(post("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions"))
			.andDo(print())
			.andExpect(status().isUnauthorized());
	}

	@Test
	@WithMockUser(roles = { /* intentionally left blank */ })
	@DisplayName("Test insufficient privilege POST /api/v1/users/{userId}/subscriptions")
	void testCreateSubscriptionForUser_Forbidden() throws Exception {
		mockMvc.perform(post("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions"))
			.andDo(print())
			.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(roles = { "Users.Administer" })
	@DisplayName("Test authenticated PATCH /api/v1/users/{userId}/subscriptions/{subscriptionId}")
	void testUpdateSubscriptionById_HappyPath() throws Exception {
		final var existingSubscription = ImmutableSubscription.builder()
			.id("00000000-0000-0000-0000-000000000000")
			.language(ImmutableLanguage.builder()
				.id("00000000-0000-0000-0000-000000000000")
				.msLocaleCode("OLD_LANGUAGE_CODE")
				.build())
			.build();

		final var existingUser = ImmutableUser.builder()
			.id("00000000-0000-0000-0000-000000000000")
			.addSubscriptions(existingSubscription)
			.build();

		final var newLanguage = ImmutableLanguage.builder()
			.id("11111111-1111-1111-1111-111111111111")
			.msLocaleCode("NEW_LANGUAGE_CODE")
			.build();

		when(userService.getUserById(existingUser.getId()))
			.thenReturn(Optional.of(existingUser));

		when(languageService.readByMsLocaleCode(newLanguage.getMsLocaleCode()))
			.thenReturn(Optional.of(newLanguage));

		final var jsonPatch = Json.createPatchBuilder()
			.replace("/msLanguageCode", "NEW_LANGUAGE_CODE")
			.build();

		mockMvc.perform(patch("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions/00000000-0000-0000-0000-000000000000")
				.contentType(JsonPatchMediaTypes.JSON_PATCH)
				.content(jsonPatch.toJsonArray().toString()))
			.andDo(print())
			.andExpect(status().isNoContent());

		verify(userService).updateSubscriptionForUser(existingUser.getId(), existingSubscription.getId(), newLanguage.getId());
	}

	@Test
	@WithMockUser(roles = { "Users.Administer" })
	@DisplayName("Test authenticated PATCH /api/v1/users/{userId}/subscriptions/{subscriptionId} w/ invalid user")
	void testUpdateSubscriptionById_InvalidUser() throws Exception {
		final var jsonPatch = Json.createPatchBuilder()
			.replace("/msLanguageCode", "NEW_LANGUAGE_CODE")
			.build();

		mockMvc.perform(patch("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions/00000000-0000-0000-0000-000000000000")
				.contentType(JsonPatchMediaTypes.JSON_PATCH)
				.content(jsonPatch.toJsonArray().toString()))
			.andDo(print())
			.andExpect(status().isNotFound())
			.andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PROBLEM_JSON_VALUE))
			.andExpect(result -> assertThat(result)
				.extracting(MvcResult::getResolvedException, type(ResourceNotFoundException.class))
				.extracting(ResourceNotFoundException::getMessage)
				.isEqualTo("No user with id=[00000000-0000-0000-0000-000000000000] was found"));
	}

	@Test
	@WithMockUser(roles = { "Users.Administer" })
	@DisplayName("Test authenticated PATCH /api/v1/users/{userId}/subscriptions/{subscriptionId} w/ invalid subscription")
	void testUpdateSubscriptionById_InvalidSubscription() throws Exception {
		final var existingUser = ImmutableUser.builder()
			.id("00000000-0000-0000-0000-000000000000")
			.build();

		final var jsonPatch = Json.createPatchBuilder()
			.replace("/msLanguageCode", "NEW_LANGUAGE_CODE")
			.build();

		when(userService.getUserById(existingUser.getId()))
			.thenReturn(Optional.of(existingUser));

		mockMvc.perform(patch("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions/00000000-0000-0000-0000-000000000000")
				.contentType(JsonPatchMediaTypes.JSON_PATCH)
				.content(jsonPatch.toJsonArray().toString()))
			.andDo(print())
			.andExpect(status().isNotFound())
			.andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PROBLEM_JSON_VALUE))
			.andExpect(result -> assertThat(result)
				.extracting(MvcResult::getResolvedException, type(ResourceNotFoundException.class))
				.extracting(ResourceNotFoundException::getMessage)
				.isEqualTo("No subscription with id=[00000000-0000-0000-0000-000000000000] was found"));
	}

	@Test
	@WithAnonymousUser
	@DisplayName("Test unauthenticated PATCH /api/v1/users/{userId}/subscriptions/{subscriptionId}")
	void testUpdateSubscriptionById_Unauthorized() throws Exception {
		mockMvc.perform(patch("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions"))
			.andDo(print())
			.andExpect(status().isUnauthorized());
	}

	@Test
	@WithMockUser(roles = { /* intentionally left blank */ })
	@DisplayName("Test insufficient privilege PATCH /api/v1/users/{userId}/subscriptions/{subscriptionId}")
	void testUpdateSubscriptionById_Forbidden() throws Exception {
		mockMvc.perform(patch("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions"))
			.andDo(print())
			.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(roles = { "Users.Administer" })
	@DisplayName("Test authenticated DELETE /api/v1/users/{userId}/subscriptions/{subscriptionId}")
	void testDeleteSubscriptionById_HappyPath() throws Exception {
		final var existingSubscription = ImmutableSubscription.builder()
			.id("00000000-0000-0000-0000-000000000000")
			.build();

		final var existingUser = ImmutableUser.builder()
			.id("00000000-0000-0000-0000-000000000000")
			.addSubscriptions(existingSubscription)
			.build();

		when(userService.getUserById(existingUser.getId()))
			.thenReturn(Optional.of(existingUser));

		mockMvc.perform(delete("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions/00000000-0000-0000-0000-000000000000"))
			.andDo(print())
			.andExpect(status().isNoContent());

		verify(userService).deleteSubscriptionForUser(existingUser.getId(), existingSubscription.getId());
	}

	@Test
	@WithMockUser(roles = { "Users.Administer" })
	@DisplayName("Test authenticated DELETE /api/v1/users/{userId}/subscriptions/{subscriptionId} w/ invalid user")
	void testDeleteSubscriptionById_InvalidUser() throws Exception {
		mockMvc.perform(delete("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions/00000000-0000-0000-0000-000000000000"))
			.andDo(print())
			.andExpect(status().isNotFound())
			.andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PROBLEM_JSON_VALUE))
			.andExpect(result -> assertThat(result)
				.extracting(MvcResult::getResolvedException, type(ResourceNotFoundException.class))
				.extracting(ResourceNotFoundException::getMessage)
				.isEqualTo("No user with id=[00000000-0000-0000-0000-000000000000] was found"));
	}

	@Test
	@WithMockUser(roles = { "Users.Administer" })
	@DisplayName("Test authenticated DELETE /api/v1/users/{userId}/subscriptions/{subscriptionId} w/ invalid subscription")
	void testDeleteSubscriptionById_InvalidSubscription() throws Exception {
		final var existingUser = ImmutableUser.builder()
			.id("00000000-0000-0000-0000-000000000000")
			.build();

		when(userService.getUserById(existingUser.getId()))
			.thenReturn(Optional.of(existingUser));

		mockMvc.perform(delete("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions/00000000-0000-0000-0000-000000000000"))
			.andDo(print())
			.andExpect(status().isNotFound())
			.andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PROBLEM_JSON_VALUE))
			.andExpect(result -> assertThat(result)
				.extracting(MvcResult::getResolvedException, type(ResourceNotFoundException.class))
				.extracting(ResourceNotFoundException::getMessage)
				.isEqualTo("No subscription with id=[00000000-0000-0000-0000-000000000000] was found"));
	}


	@Test
	@WithAnonymousUser
	@DisplayName("Test unauthenticated DELETE /api/v1/users/{userId}/subscriptions/{subscriptionId}")
	void testDeleteSubscriptionById_Unauthorized() throws Exception {
		mockMvc.perform(delete("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions"))
			.andDo(print())
			.andExpect(status().isUnauthorized());
	}

	@Test
	@WithMockUser(roles = { /* intentionally left blank */ })
	@DisplayName("Test insufficient privilege DELETE /api/v1/users/{userId}/subscriptions/{subscriptionId}")
	void testDeleteSubscriptionById_Forbidden() throws Exception {
		mockMvc.perform(delete("/api/v1/users/00000000-0000-0000-0000-000000000000/subscriptions"))
			.andDo(print())
			.andExpect(status().isForbidden());
	}

}
