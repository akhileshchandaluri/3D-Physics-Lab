package com.physim.repository;

import com.physim.entity.UserEntity;
import com.physim.entity.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, String> {

    Optional<UserEntity> findByEmail(String email);

    Optional<UserEntity> findByWebauthnUserHandle(String webauthnUserHandle);

    Optional<UserEntity> findByWebauthnCredentialId(String webauthnCredentialId);

    Optional<UserEntity> findByAuthProviderAndProviderId(String authProvider, String providerId);

    boolean existsByEmail(String email);

    long countByRole(UserRole role);

    // -----------------------------------------------------------------------
    // Role-filtered queries (search is a proper String, never null bytea issue)
    // -----------------------------------------------------------------------

    @Query(value = "SELECT * FROM users u WHERE u.role = CAST(:role AS text) AND " +
                   "(:search IS NULL OR lower(u.name) LIKE lower(CONCAT('%', CAST(:search AS text), '%')) OR lower(u.email) LIKE lower(CONCAT('%', CAST(:search AS text), '%'))) " +
                   "ORDER BY u.created_at DESC",
           countQuery = "SELECT count(*) FROM users u WHERE u.role = CAST(:role AS text) AND " +
                        "(:search IS NULL OR lower(u.name) LIKE lower(CONCAT('%', CAST(:search AS text), '%')) OR lower(u.email) LIKE lower(CONCAT('%', CAST(:search AS text), '%')))",
           nativeQuery = true)
    Page<UserEntity> searchUsersByRole(@Param("role") String role, @Param("search") String search, Pageable pageable);

    // -----------------------------------------------------------------------
    // All-users queries (no role filter)
    // -----------------------------------------------------------------------

    @Query(value = "SELECT * FROM users u WHERE " +
                   "(:search IS NULL OR lower(u.name) LIKE lower(CONCAT('%', CAST(:search AS text), '%')) OR lower(u.email) LIKE lower(CONCAT('%', CAST(:search AS text), '%'))) " +
                   "ORDER BY u.created_at DESC",
           countQuery = "SELECT count(*) FROM users u WHERE " +
                        "(:search IS NULL OR lower(u.name) LIKE lower(CONCAT('%', CAST(:search AS text), '%')) OR lower(u.email) LIKE lower(CONCAT('%', CAST(:search AS text), '%')))",
           nativeQuery = true)
    Page<UserEntity> searchAllUsers(@Param("search") String search, Pageable pageable);

    /** Dispatcher — routes to role-specific or all-users query to avoid Hibernate null-enum / null-bytea issues. */
    default Page<UserEntity> searchUsers(UserRole role, String search, Pageable pageable) {
        if (role != null) {
            return searchUsersByRole(role.name(), search, pageable);
        }
        return searchAllUsers(search, pageable);
    }
}
