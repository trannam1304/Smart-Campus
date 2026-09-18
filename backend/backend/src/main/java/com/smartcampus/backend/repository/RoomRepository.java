package com.smartcampus.backend.repository;

import com.smartcampus.backend.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

// FR-2.1, FR-2.2, FR-2.3, FR-2.4
public interface RoomRepository extends JpaRepository<Room, Long> {
    // TODO (Nhóm 2 - Room): thêm query lọc theo building/floor/capacity/thiết bị (FR-2.3)
}
