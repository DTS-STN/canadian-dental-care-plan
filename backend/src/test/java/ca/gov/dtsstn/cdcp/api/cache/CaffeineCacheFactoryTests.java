package ca.gov.dtsstn.cdcp.api.cache;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.caffeine.CaffeineCache;

/**
 * Tests for {@link CaffeineCacheFactory}.
 * <p>
 * Note that since we can't easily access the generated cache, this
 * test only asserts that we can build the cache without encountering
 * exceptions. Also, some properties are mutually exclusive, so there
 * are two test variants to cover these cases.
 */
@ExtendWith({ MockitoExtension.class })
class CaffeineCacheFactoryTests {

	CaffeineCacheFactory caffeineCacheFactory;

	@BeforeEach
	void beforeEach() {
		this.caffeineCacheFactory = new CaffeineCacheFactory("cache");
	}

	@Test
	@DisplayName("Test caffeineCacheFactory.getObject() w/ default values")
	void testGetObject_DefaultValues() {
		assertDoesNotThrow(() -> caffeineCacheFactory.getObject());
	}

	@Test
	@DisplayName("Test caffeineCacheFactory.getObject() w/ non-default values")
	void testGetObject_NonDefaultValues() {
		caffeineCacheFactory.setExpireAfterAccess(1024L);
		caffeineCacheFactory.setExpireAfterWrite(1024L);
		caffeineCacheFactory.setInitialCapacity(1024);
		caffeineCacheFactory.setMaximumSize(1024);
		caffeineCacheFactory.setRecordStats(false);
		caffeineCacheFactory.setTimeUnit(TimeUnit.MILLISECONDS);
		assertDoesNotThrow(() -> caffeineCacheFactory.getObject());
	}

	@Test
	@DisplayName("Test caffeineCacheFactory.getObjectType()")
	void testGetObjectType() {
		assertThat(caffeineCacheFactory.getObjectType()).isEqualTo(CaffeineCache.class);
	}

	@Test
	@DisplayName("Test caffeineCacheFactory.isEagerInit()")
	void testIsEagerInit() {
		assertThat(caffeineCacheFactory.isEagerInit()).isTrue();
	}

}
