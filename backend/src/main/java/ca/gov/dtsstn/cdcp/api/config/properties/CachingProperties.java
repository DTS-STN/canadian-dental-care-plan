package ca.gov.dtsstn.cdcp.api.config.properties;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.Min;

@Validated
public class CachingProperties {

	private boolean enabled = true;

	private final Map<String, CacheProperties> caches = new HashMap<>();

	public Map<String, CacheProperties> getCaches() {
		return caches;
	}

	public boolean getEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public static class CacheProperties {

		@Min(0)
		private Long expireAfterAccess;

		@Min(0)
		private Long expireAfterWrite;

		@Min(0)
		private Integer initialCapacity;

		@Min(0)
		private Integer maximumSize;

		private boolean recordStats = true;

		private TimeUnit timeUnit = TimeUnit.MINUTES;

		public Long getExpireAfterAccess() {
			return expireAfterAccess;
		}

		public void setExpireAfterAccess(Long expireAfterAccess) {
			this.expireAfterAccess = expireAfterAccess;
		}

		public Long getExpireAfterWrite() {
			return expireAfterWrite;
		}

		public void setExpireAfterWrite(Long expireAfterWrite) {
			this.expireAfterWrite = expireAfterWrite;
		}

		public Integer getInitialCapacity() {
			return initialCapacity;
		}

		public void setInitialCapacity(Integer initialCapacity) {
			this.initialCapacity = initialCapacity;
		}

		public Integer getMaximumSize() {
			return maximumSize;
		}

		public void setMaximumSize(Integer maximumSize) {
			this.maximumSize = maximumSize;
		}

		public boolean getRecordStats() {
			return recordStats;
		}

		public void setRecordStats(boolean recordStats) {
			this.recordStats = recordStats;
		}

		public TimeUnit getTimeUnit() {
			return timeUnit;
		}

		public void setTimeUnit(TimeUnit timeUnit) {
			this.timeUnit = timeUnit;
		}

	}

}
