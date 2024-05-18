package ca.gov.dtsstn.cdcp.api.data.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.dao.IncorrectResultSizeDataAccessException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import ca.gov.dtsstn.cdcp.api.data.entity.UserEntity;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, String> {

	List<UserEntity> findByEmail(String email);

	@Query("""
		SELECT user FROM User user JOIN FETCH user.userAttributes userAttribute
		 WHERE userAttribute.name=:name
		   AND userAttribute.value=:value
	""")
	List<UserEntity> findByUserAttributeValue(String name, String value);

	default Optional<UserEntity> findByRaoidcUserId(String raoidcUserId) {
		final var users = findByUserAttributeValue("RAOIDC_USER_ID", raoidcUserId);
		if (users.size() > 1) { throw new IncorrectResultSizeDataAccessException("findByRaoidcUserId() returned more than one result", 1); }
		return users.stream().findFirst();
	}

}
