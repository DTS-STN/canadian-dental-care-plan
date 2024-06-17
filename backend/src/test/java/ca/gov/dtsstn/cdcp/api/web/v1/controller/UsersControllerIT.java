package ca.gov.dtsstn.cdcp.api.web.v1.controller;

import static org.hamcrest.CoreMatchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

import ca.gov.dtsstn.cdcp.api.config.WebSecurityConfig;
import ca.gov.dtsstn.cdcp.api.service.UserService;
import ca.gov.dtsstn.cdcp.api.service.domain.ImmutableUser;
import ca.gov.dtsstn.cdcp.api.service.domain.ImmutableUserAttribute;
import ca.gov.dtsstn.cdcp.api.web.json.JsonPatchProcessor;

@ActiveProfiles("test")
@Import({ WebSecurityConfig.class })
@WebMvcTest({ UsersController.class })
@ComponentScan({ "ca.gov.dtsstn.cdcp.api.web.v1.model.mapper" })
class UsersControllerIT {

	@MockBean JsonPatchProcessor jsonPatchProcessor;

	@MockBean UserService userService;

	@Autowired MockMvc mockMvc;

	@Test
	@DisplayName("Test authenticated GET /api/v1/users/{id}")
	@WithMockUser(roles = { "Users.Administer" })
	void testGetUserById() throws Exception {
		final var mockUser = ImmutableUser.builder()
			.id("00000000-0000-0000-0000-000000000000")
			.email("user@example.com")
			.emailVerified(true)
			.addUserAttributes(ImmutableUserAttribute.builder()
				.name("EXAMPLE_ATTRIBUTE")
				.value("42")
				.build())
			.build();

		when(userService.getUserById(any())).thenReturn(Optional.of(mockUser));

		mockMvc.perform(get("/api/v1/users/00000000-0000-0000-0000-000000000000"))
			.andDo(print())
			.andExpect(status().isOk())
			.andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaTypes.HAL_JSON_VALUE))
			.andExpect(jsonPath("$.id", is("00000000-0000-0000-0000-000000000000")))
			.andExpect(jsonPath("$.email", is("user@example.com")))
			.andExpect(jsonPath("$.emailVerified", is(true)))
			.andExpect(jsonPath("$.userAttributes[0].name", is("EXAMPLE_ATTRIBUTE")))
			.andExpect(jsonPath("$.userAttributes[0].value", is("42")))
			.andExpect(jsonPath("$._links.self.href", is("http://localhost/api/v1/users/00000000-0000-0000-0000-000000000000")));
	}

	@Test
	@WithMockUser(roles = { "Users.Administer" })
	@DisplayName("Test authenticated GET /api/v1/users/{id} -- 404 not found")
	void testGetUserById_NotFound() throws Exception {
		when(userService.getUserById(any())).thenReturn(Optional.empty());

		mockMvc.perform(get("/api/v1/users/00000000-0000-0000-0000-000000000000"))
			.andDo(print())
			.andExpect(status().isNotFound())
			.andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PROBLEM_JSON_VALUE))
			.andExpect(jsonPath("$.status", is(404)))
			.andExpect(jsonPath("$.title", is("Not Found")))
			.andExpect(jsonPath("$.detail", is("No user with id=[00000000-0000-0000-0000-000000000000] was found")))
			.andExpect(jsonPath("$.instance", is("/api/v1/users/00000000-0000-0000-0000-000000000000")))
			.andExpect(jsonPath("$.type", is("https://datatracker.ietf.org/doc/html/rfc7231#section-6.5.4")));
	}

	@Test
	@WithAnonymousUser
	@DisplayName("Test unauthenticated GET /api/v1/users/{id}")
	void testGetUserById_Unauthorized() throws Exception {
		mockMvc.perform(get("/api/v1/users/00000000-0000-0000-0000-000000000000"))
			.andDo(print())
			.andExpect(status().isUnauthorized());
	}

	@Test
	@WithMockUser(roles = { /* intentionally left blank */ })
	@DisplayName("Test insufficient privilege GET /api/v1/users/{id}")
	void testGetUserById_Forbidden() throws Exception {
		mockMvc.perform(get("/api/v1/users/00000000-0000-0000-0000-000000000000"))
			.andDo(print())
			.andExpect(status().isForbidden());
	}

}
