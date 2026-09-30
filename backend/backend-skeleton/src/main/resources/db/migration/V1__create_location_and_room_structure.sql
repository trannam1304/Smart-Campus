-- Flyway migration: V1__create_location_and_room_structure.sql

-- 1. CẤU TRÚC ĐỊA ĐIỂM & LOẠI PHÒNG (LOCATION & ROOM STRUCTURE)
-- =====================================================================

CREATE TABLE IF NOT EXISTS buildings (
    building_id INT AUTO_INCREMENT PRIMARY KEY,
    building_name VARCHAR(100) NOT NULL,

    CONSTRAINT uq_buildings_name UNIQUE (building_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS floors (
    floor_id INT AUTO_INCREMENT PRIMARY KEY, 
    building_id INT NOT NULL,
    floor_number INT NOT NULL,
    floor_map_svg_url VARCHAR(500) NULL,
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,

    CONSTRAINT uq_floors_building_floor UNIQUE (building_id, floor_number),
    CONSTRAINT fk_floors_building
        FOREIGN KEY (building_id) REFERENCES buildings(building_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS room_types (
    room_type_id INT AUTO_INCREMENT PRIMARY KEY,
    type_code ENUM(
        'GROUP',
        'GROUP_AREA',
        'INDIVIDUAL',
        'PRESENTATION',
        'VIDEO_ROOM',
        'VIDEO_AREA',
        'NIGHT_AREA',
        'STUDIO',
        'CONFERENCE'
    ) NOT NULL,
    type_name VARCHAR(100) NOT NULL,
    default_duration_minutes INT NOT NULL,
    min_duration_minutes INT NOT NULL,
    max_duration_minutes INT NULL,
    slot_minutes INT NOT NULL DEFAULT 30,
    occupancy_min_ratio DECIMAL(4,2) NOT NULL DEFAULT 0.50,
    min_headcount INT NULL,
    
    CONSTRAINT uq_room_types_code UNIQUE (type_code),

    CONSTRAINT chk_room_type_duration
        CHECK (
            min_duration_minutes > 0
            AND default_duration_minutes >= min_duration_minutes
            AND (max_duration_minutes IS NULL OR max_duration_minutes >= default_duration_minutes)
        ),

    CONSTRAINT chk_room_type_slot
        CHECK (slot_minutes > 0),

    CONSTRAINT chk_room_type_ratio
        CHECK (occupancy_min_ratio >= 0 AND occupancy_min_ratio <= 1),
        
    CONSTRAINT chk_room_type_min_headcount 
        CHECK (min_headcount IS NULL OR min_headcount > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    floor_id INT NOT NULL,
    room_type_id INT NOT NULL,
    room_code VARCHAR(30) NOT NULL,
    capacity INT NOT NULL,
    base_status ENUM('AVAILABLE', 'MAINTENANCE')
        NOT NULL DEFAULT 'AVAILABLE',
    map_pos_x DECIMAL(10,2) NULL,
    map_pos_y DECIMAL(10,2) NULL,

    -- CÁC TRƯỜNG NGHIỆP VỤ ĐÃ ĐƯỢC CHUYỂN TỪ ROOM_TYPES XUỐNG ĐÂY
    lead_time_days INT NOT NULL DEFAULT 0,
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    allow_overlap_booking BOOLEAN NOT NULL DEFAULT FALSE,
    fee_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    fee_per_hour DECIMAL(12,2) NULL,

    CONSTRAINT uq_rooms_code UNIQUE (room_code),
    CONSTRAINT chk_rooms_capacity CHECK (capacity > 0),
    CONSTRAINT chk_rooms_map_pos 
        CHECK ((map_pos_x IS NULL OR map_pos_x >= 0) AND (map_pos_y IS NULL OR map_pos_y >= 0)),
        
    -- Ràng buộc bước chia khung giờ và hạn đặt trước
    CONSTRAINT chk_rooms_lead_time
        CHECK (lead_time_days >= 0),

    -- Ràng buộc tính nhất quán của cấu hình thu phí
    CONSTRAINT chk_rooms_fee
        CHECK (
            (fee_enabled = FALSE AND fee_per_hour IS NULL)
            OR (fee_enabled = TRUE AND fee_per_hour >= 0)
        ),

    CONSTRAINT fk_rooms_floor
        FOREIGN KEY (floor_id) REFERENCES floors(floor_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_rooms_type
        FOREIGN KEY (room_type_id) REFERENCES room_types(room_type_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS equipment (
    equipment_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    equipment_name VARCHAR(150) NOT NULL,
    equipment_type VARCHAR(100) NOT NULL,
    status ENUM('GOOD', 'BROKEN', 'REPAIRING')
        NOT NULL DEFAULT 'GOOD',

    CONSTRAINT fk_equipment_room
        FOREIGN KEY (room_id) REFERENCES rooms(room_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================