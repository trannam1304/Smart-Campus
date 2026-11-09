package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.List;

/**
 * Truy vấn Refresh Token (bảng refresh_tokens). Liên quan FR-1.2, NFR-03.
 */
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    List<RefreshToken> findByUserId(Long userId);

    @Modifying
    @Transactional
    @Query("UPDATE RefreshToken r SET r.isRevoked = true WHERE r.tokenHash = ?1")
    void revokeByTokenHash(String tokenHash);

    @Modifying
    @Transactional
    @Query("UPDATE RefreshToken r SET r.isRevoked = true WHERE r.userId = ?1")
    void revokeAllByUserId(Long userId);

    void deleteByUserId(Long userId);
}

