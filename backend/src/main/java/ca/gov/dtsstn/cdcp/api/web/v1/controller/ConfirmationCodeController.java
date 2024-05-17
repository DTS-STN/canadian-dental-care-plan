package ca.gov.dtsstn.cdcp.api.web.v1.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.StreamSupport;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ca.gov.dtsstn.cdcp.api.service.ConfirmationCodeService;
import ca.gov.dtsstn.cdcp.api.web.v1.model.ConfirmationCodeModel;
import ca.gov.dtsstn.cdcp.api.web.v1.model.mapper.ConfirmationCodeModelAssembler;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import ca.gov.dtsstn.cdcp.api.service.domain.ConfirmationCode;

@Validated
@RestController
@RequestMapping({"/api/v1/confirmation-codes"})
@Tag(name = "confirmationCodes", description = "CRUD endpoint for confirmation codes.")
public class ConfirmationCodeController {

	private final ConfirmationCodeModelAssembler confirmationCodeModelAssembler;
	private final ConfirmationCodeService confirmationCodeService;

	public ConfirmationCodeController(ConfirmationCodeModelAssembler confirmationCodeModelAssembler,
			ConfirmationCodeService confirmationCodeService) {
		this.confirmationCodeModelAssembler = confirmationCodeModelAssembler;
		this.confirmationCodeService = confirmationCodeService;
	}

	@GetMapping({"/confirmation-codes/{userEmail}"})
	@Operation(summary = "Get all confirmation codes for a user.",
			operationId = "get-confirmation-codes")
	public List<ConfirmationCodeModel> getConfirmationCodesByUserEmail(
			@NotBlank(message = "userEmail must not be null or blank") @Parameter(
					description = "The email of the user.", example = "user@email.com",
					required = true) @PathVariable String userEmail) {
		List<ConfirmationCode> confirmationCodes =
				confirmationCodeService.getConfirmationCodesByEmail(userEmail);
		if (confirmationCodes.size() > 0) {
			return StreamSupport.stream(confirmationCodes.spliterator(), false)
					.map(confirmationCodeModelAssembler::toModel).toList();
		}
		List<ConfirmationCodeModel> emptyList = new ArrayList<>();
		return emptyList;
}

}
