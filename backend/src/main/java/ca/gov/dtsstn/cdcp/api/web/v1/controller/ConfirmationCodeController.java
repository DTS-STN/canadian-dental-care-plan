package ca.gov.dtsstn.cdcp.api.web.v1.controller;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ca.gov.dtsstn.cdcp.api.service.ConfirmationCodeService;
import ca.gov.dtsstn.cdcp.api.service.ConfirmationCodeStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import ca.gov.dtsstn.cdcp.api.service.domain.ConfirmationCode;

@Validated
@RestController
@RequestMapping({ "/api/v1" })
@Tag(name = "confirmationCodes", description = "CRUD endpoint for confirmation codes.")
public class ConfirmationCodeController {

    private final ConfirmationCodeService confirmationCodeService;

    public ConfirmationCodeController(ConfirmationCodeService confirmationCodeService){
        this.confirmationCodeService = confirmationCodeService;
    }

    @PostMapping({ "/verifyCode/"})
    @Operation(summary = "Verify the status of a confirmation code.", operationId="verify-confirmation-code")
    public ConfirmationCodeStatus getConfirmationCodeStatus(
            @NotBlank(message = "code must not be null or blank")
            @Parameter(description = "The confirmation code.", required = true)
            @RequestParam ConfirmationCode code,
            @NotBlank(message = "userId must not be null or blank")
            @Parameter(description = "The ID of the user.", required = true)
            @RequestParam String userId
        ){
    		return confirmationCodeService.verifyConfirmationCode(code, userId);
    }

}