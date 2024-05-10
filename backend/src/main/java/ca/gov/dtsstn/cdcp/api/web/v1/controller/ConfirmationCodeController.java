package ca.gov.dtsstn.cdcp.api.web.v1.controller;
import java.util.List;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ca.gov.dtsstn.cdcp.api.service.ConfirmationCodeService;
import ca.gov.dtsstn.cdcp.api.web.v1.model.ConfirmationCodeModel;
import ca.gov.dtsstn.cdcp.api.web.v1.model.ConfirmationCodeModelMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;

@Validated
@RestController
@RequestMapping({ "/api/v1" })
@Tag(name = "confirmationCodes", description = "CRUD endpoint for confirmation codes.")
public class ConfirmationCodeController {
    
    private final ConfirmationCodeModelMapper confirmationCodeModelMapper;

    private final ConfirmationCodeService confirmationCodeService;

    public ConfirmationCodeController(ConfirmationCodeModelMapper confirmationCodeModelMapper, ConfirmationCodeService confirmationCodeService){
        this.confirmationCodeModelMapper = confirmationCodeModelMapper;
        this.confirmationCodeService = confirmationCodeService;
    }

    @GetMapping({ "/users/{userEmail}/confirmationCodes" })
	@Operation(summary = "Get all confirmation codes for a user.", operationId = "get-confirmation-codes")
    public List<ConfirmationCodeModel> getConfirmationCodes(
        @NotBlank(message = "userEmail must not be null or blank")
        @Parameter(description = "The email of the user.", example = "user@email.com", required = true)
        @PathVariable String userEmail
    ){
     return confirmationCodeModelMapper.toModel(confirmationCodeService.getConfirmationCodesByEmail(userEmail));  
    }

}