package ca.gov.dtsstn.cdcp.api.web.v1.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

import ca.gov.dtsstn.cdcp.api.config.WebSecurityConfig;
import ca.gov.dtsstn.cdcp.api.service.UserService;
import ca.gov.dtsstn.cdcp.api.service.domain.ImmutableConfirmationCode;
import ca.gov.dtsstn.cdcp.api.service.domain.ImmutableUser;
import ca.gov.dtsstn.cdcp.api.web.exception.ResourceNotFoundException;
import ca.gov.dtsstn.cdcp.api.web.v1.model.ImmutableEmailValidationModel;

@ActiveProfiles("test")
@Import({ WebSecurityConfig.class })
@WebMvcTest({ EmailValidationsController.class })
class EmailValidationsControllerIT {

	@MockBean UserService userService;

	@Autowired MockMvc mockMvc;

	final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	@DisplayName("Test authenticated POST /api/v1/users/{userId}/email-validations with valid code and user found")
	@WithMockUser(roles = { "Users.Administer" })
	void testVerifyConfirmationCodeStatus_Valid() throws Exception {
		final var mockUser = ImmutableUser.builder()
			.id("00000000-0000-0000-0000-000000000000")
			.addConfirmationCodes(ImmutableConfirmationCode.builder().code("code value").build())
			.build();

		when(userService.getUserById(any())).thenReturn(Optional.of(mockUser));
		when(userService.verifyEmail(anyString(), anyString())).thenReturn(true);

		mockMvc.perform(post("/api/v1/users/00000000-0000-0000-0000-000000000000/email-validations")
				.with(csrf()).header("origin", "http://localhost")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(ImmutableEmailValidationModel.builder().confirmationCode("code value").build()))
				.accept(MediaType.APPLICATION_JSON))
			.andDo(print())
			.andExpect(status().isAccepted());
	}

	@Test
	@DisplayName("Test authenticated POST /api/v1/users/{userId}/email-validations with invalid code and user found")
	@WithMockUser(roles = { "Users.Administer" })
	void testVerifyConfirmationCodeStatus_Invalid() throws Exception {
		final var mockUser = ImmutableUser.builder()
			.emailVerified(false)
			.addConfirmationCodes(ImmutableConfirmationCode.builder().code("other code value").build())
			.build();

			when(userService.getUserById(any())).thenReturn(Optional.of(mockUser));
			when(userService.verifyEmail(anyString(), any())).thenReturn(false);

			mockMvc.perform(post("/api/v1/users/00000000-0000-0000-0000-000000000000/email-validations")
					.with(csrf()).header("origin", "http://localhost")
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(ImmutableEmailValidationModel.builder().confirmationCode("code value").build()))
					.accept(MediaType.APPLICATION_JSON))
				.andDo(print())
				.andExpect(status().isBadRequest());
	}

	@Test
	@DisplayName("Test authenticated POST /api/v1/users/{userId}/email-validations with no user found")
	@WithMockUser(roles = { "Users.Administer" })
	void testVerifyConfirmationCodeStatus_UserNotFound() throws Exception {
		when(userService.getUserById(any())).thenReturn(Optional.empty());
		when(userService.verifyEmail(anyString(), any())).thenThrow(new ResourceNotFoundException("No user with id=[%s] was found".formatted("00000000-0000-0000-0000-000000000000")));

		mockMvc.perform(post("/api/v1/users/00000000-0000-0000-0000-000000000000/email-validations")
				.with(csrf()).header("origin", "http://localhost")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(ImmutableEmailValidationModel.builder().confirmationCode("code value").build()))
				.accept(MediaType.APPLICATION_JSON))
			.andDo(print())
			.andExpect(status().isNotFound());
	}

}
