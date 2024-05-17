package ca.gov.dtsstn.cdcp.api.service;

import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import ca.gov.dtsstn.cdcp.api.data.repository.ConfirmationCodeRepository;
import ca.gov.dtsstn.cdcp.api.service.domain.ConfirmationCode;
import java.util.List;
import ca.gov.dtsstn.cdcp.api.service.domain.mapper.ConfirmationCodeMapper;

@Service
public class ConfirmationCodeService {

    private final ConfirmationCodeMapper mapper;

    private final ConfirmationCodeRepository repository;

    public ConfirmationCodeService(ConfirmationCodeMapper mapper, ConfirmationCodeRepository repository) {
		Assert.notNull(mapper, "mapper is required; it must not be null");
		Assert.notNull(repository, "repository is required; it must not be null");
		this.mapper = mapper;
		this.repository = repository;
	}


    public List<ConfirmationCode> getConfirmationCodesByUserId(String userId) {
        Assert.hasText(userId, "userId is required; it must not be null or blank");
        return mapper.fromEntity(repository.findByUserId(userId));
    }

    public List<ConfirmationCode> getConfirmationCodesByEmail(String email) {
        Assert.hasText(email, "email is required; it must not be null or blank");
        return mapper.fromEntity(repository.findByEmail(email));
    }
}
