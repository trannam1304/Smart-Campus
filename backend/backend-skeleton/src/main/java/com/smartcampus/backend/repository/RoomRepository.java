package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.Room;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

// FR-2.1, FR-2.2, FR-2.3, FR-2.4
public interface RoomRepository extends JpaRepository<Room, Long> {

    // TODO (Nhóm 2 - Room): thêm query lọc theo building/floor/capacity/thiết bị (FR-2.3)

    /**
     * Khóa pessimistic_WRITE trên hàng phòng khi kiểm tra trùng lịch (FR-3.2).
     * Đảm bảo chỉ một giao dịch tại một thời điểm có thể đọc/ghi phòng này,
     * tránh hai request cùng xét "phòng trống" rồi cùng insert → double booking.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Room r WHERE r.id = :id")
    Optional<Room> findByIdForUpdate(@Param("id") Long id);
}
