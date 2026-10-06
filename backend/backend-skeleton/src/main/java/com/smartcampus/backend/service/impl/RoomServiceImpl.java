package com.smartcampus.backend.service.impl;

import com.smartcampus.backend.dto.request.BuildingRequest;
import com.smartcampus.backend.dto.request.EquipmentRequest;
import com.smartcampus.backend.dto.request.RoomUpsertRequest;
import com.smartcampus.backend.dto.response.BuildingResponse;
import com.smartcampus.backend.dto.response.EquipmentResponse;
import com.smartcampus.backend.dto.response.ManagedRoomResponse;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.service.RoomService;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class RoomServiceImpl implements RoomService {

    private static final String ROOM_SELECT = """
            SELECT r.room_id, r.room_code, r.capacity, r.base_status,
                   b.building_id, b.building_name, f.floor_number, rt.type_code,
                   e.equipment_id, e.equipment_name, e.equipment_type, e.status AS equipment_status
            FROM rooms r
            JOIN floors f ON f.floor_id = r.floor_id
            JOIN buildings b ON b.building_id = f.building_id
            JOIN room_types rt ON rt.room_type_id = r.room_type_id
            LEFT JOIN equipment e ON e.room_id = r.room_id
            """;

    private final NamedParameterJdbcTemplate jdbc;

    public RoomServiceImpl(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ManagedRoomResponse> getRooms(int page, int limit) {
        validatePage(page, limit);
        return queryRooms(ROOM_SELECT + """
                ORDER BY r.room_id
                LIMIT :limit OFFSET :offset
                """, new MapSqlParameterSource()
                .addValue("limit", limit)
                .addValue("offset", (long) (page - 1) * limit));
    }

    @Override
    @Transactional(readOnly = true)
    public long countRooms() {
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM rooms", Map.of(), Long.class);
        return count == null ? 0 : count;
    }

    @Override
    @Transactional(readOnly = true)
    public ManagedRoomResponse getRoom(String roomId) {
        long id = parseId(roomId, "ROOM-", "phòng");
        List<ManagedRoomResponse> rooms = queryRooms(ROOM_SELECT + " WHERE r.room_id = :roomId ORDER BY e.equipment_id",
                new MapSqlParameterSource("roomId", id));
        if (rooms.isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy phòng.");
        }
        return rooms.get(0);
    }

    @Override
    @Transactional
    public ManagedRoomResponse createRoom(RoomUpsertRequest request) {
        long floorId = findFloorId(request.buildingId(), request.floorNumber());
        long roomTypeId = findRoomTypeId(request.roomTypeCode());
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.getJdbcTemplate().update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO rooms (floor_id, room_type_id, room_code, capacity, base_status)
                    VALUES (?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setLong(1, floorId);
            statement.setLong(2, roomTypeId);
            statement.setString(3, request.roomCode().trim());
            statement.setInt(4, request.capacity());
            statement.setString(5, request.status());
            return statement;
        }, keyHolder);
        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Cơ sở dữ liệu không trả về mã phòng vừa tạo.");
        }
        return getRoom("ROOM-" + key.longValue());
    }

    @Override
    @Transactional
    public ManagedRoomResponse updateRoom(String roomId, RoomUpsertRequest request) {
        long id = parseId(roomId, "ROOM-", "phòng");
        ensureRoomExists(id);
        long floorId = findFloorId(request.buildingId(), request.floorNumber());
        long roomTypeId = findRoomTypeId(request.roomTypeCode());
        jdbc.update("""
                        UPDATE rooms
                        SET floor_id = :floorId, room_type_id = :roomTypeId, room_code = :roomCode,
                            capacity = :capacity, base_status = :status
                        WHERE room_id = :roomId
                        """,
                roomParameters(request).addValue("floorId", floorId)
                        .addValue("roomTypeId", roomTypeId).addValue("roomId", id));
        return getRoom(roomId);
    }

    @Override
    @Transactional
    public void deleteRoom(String roomId) {
        long id = parseId(roomId, "ROOM-", "phòng");
        ensureRoomExists(id);
        jdbc.update("DELETE FROM rooms WHERE room_id = :roomId", Map.of("roomId", id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BuildingResponse> getBuildings() {
        return jdbc.query("""
                        SELECT building_id, building_name FROM buildings ORDER BY building_id
                        """, Map.of(),
                (rs, rowNum) -> new BuildingResponse(rs.getLong("building_id"), rs.getString("building_name")));
    }

    @Override
    @Transactional
    public BuildingResponse createBuilding(BuildingRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.getJdbcTemplate().update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    "INSERT INTO buildings (building_name) VALUES (?)", Statement.RETURN_GENERATED_KEYS);
            statement.setString(1, request.buildingName().trim());
            return statement;
        }, keyHolder);
        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Cơ sở dữ liệu không trả về mã tòa nhà vừa tạo.");
        }
        return getBuilding(key.longValue());
    }

    @Override
    @Transactional
    public BuildingResponse updateBuilding(long buildingId, BuildingRequest request) {
        ensureBuildingExists(buildingId);
        jdbc.update("UPDATE buildings SET building_name = :name WHERE building_id = :id",
                Map.of("name", request.buildingName().trim(), "id", buildingId));
        return getBuilding(buildingId);
    }

    @Override
    @Transactional
    public void deleteBuilding(long buildingId) {
        ensureBuildingExists(buildingId);
        jdbc.update("DELETE FROM buildings WHERE building_id = :id", Map.of("id", buildingId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EquipmentResponse> getRoomEquipments(String roomId) {
        long id = parseId(roomId, "ROOM-", "phòng");
        ensureRoomExists(id);
        return jdbc.query("""
                        SELECT equipment_id, equipment_name, equipment_type, status
                        FROM equipment WHERE room_id = :roomId ORDER BY equipment_id
                        """, Map.of("roomId", id), this::mapEquipment);
    }

    @Override
    @Transactional
    public EquipmentResponse createEquipment(String roomId, EquipmentRequest request) {
        long id = parseId(roomId, "ROOM-", "phòng");
        ensureRoomExists(id);
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.getJdbcTemplate().update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO equipment (room_id, equipment_name, equipment_type, status)
                    VALUES (?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setLong(1, id);
            statement.setString(2, request.name().trim());
            statement.setString(3, request.type().trim());
            statement.setString(4, request.status());
            return statement;
        }, keyHolder);
        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Cơ sở dữ liệu không trả về mã thiết bị vừa tạo.");
        }
        return getEquipment(key.longValue());
    }

    @Override
    @Transactional
    public EquipmentResponse updateEquipment(String equipmentId, EquipmentRequest request) {
        long id = parseId(equipmentId, "EQ-", "thiết bị");
        ensureEquipmentExists(id);
        jdbc.update("""
                        UPDATE equipment
                        SET equipment_name = :name, equipment_type = :type, status = :status
                        WHERE equipment_id = :id
                        """, new MapSqlParameterSource().addValue("name", request.name().trim())
                .addValue("type", request.type().trim()).addValue("status", request.status()).addValue("id", id));
        return getEquipment(id);
    }

    @Override
    @Transactional
    public void deleteEquipment(String equipmentId) {
        long id = parseId(equipmentId, "EQ-", "thiết bị");
        ensureEquipmentExists(id);
        jdbc.update("DELETE FROM equipment WHERE equipment_id = :id", Map.of("id", id));
    }

    private List<ManagedRoomResponse> queryRooms(String sql, SqlParameterSource parameters) {
        Map<Long, RoomRow> rooms = new LinkedHashMap<>();
        jdbc.query(sql, parameters, (RowCallbackHandler) rs -> {
            RoomLine line = mapRoomLine(rs);
            RoomRow room = rooms.computeIfAbsent(line.roomId(), ignored -> new RoomRow(
                    line.roomId(), line.roomCode(), line.buildingId(), line.buildingName(), line.floorNumber(),
                    line.capacity(), line.status(), line.roomTypeCode()));
            if (line.equipmentId() != null) {
                room.equipments.add(new EquipmentResponse("EQ-" + line.equipmentId(), line.equipmentName(),
                        line.equipmentType(), line.equipmentStatus()));
            }
        });
        return rooms.values().stream().map(RoomRow::toResponse).toList();
    }

    private RoomLine mapRoomLine(ResultSet rs) throws SQLException {
        long equipmentId = rs.getLong("equipment_id");
        Long nullableEquipmentId = rs.wasNull() ? null : equipmentId;
        return new RoomLine(rs.getLong("room_id"), rs.getString("room_code"), rs.getLong("building_id"),
                rs.getString("building_name"), rs.getInt("floor_number"), rs.getInt("capacity"),
                rs.getString("base_status"), rs.getString("type_code"), nullableEquipmentId,
                rs.getString("equipment_name"), rs.getString("equipment_type"), rs.getString("equipment_status"));
    }

    private EquipmentResponse mapEquipment(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return new EquipmentResponse("EQ-" + rs.getLong("equipment_id"), rs.getString("equipment_name"),
                rs.getString("equipment_type"), rs.getString("status"));
    }

    private EquipmentResponse getEquipment(long id) {
        return jdbc.query("""
                        SELECT equipment_id, equipment_name, equipment_type, status
                        FROM equipment WHERE equipment_id = :id
                        """, Map.of("id", id), (rs, rowNum) -> mapEquipment(rs, rowNum))
                .stream().findFirst().orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thiết bị."));
    }

    private BuildingResponse getBuilding(long id) {
        return jdbc.query("""
                        SELECT building_id, building_name FROM buildings WHERE building_id = :id
                        """, Map.of("id", id),
                (rs, rowNum) -> new BuildingResponse(rs.getLong("building_id"), rs.getString("building_name")))
                .stream().findFirst().orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tòa nhà."));
    }

    private long findFloorId(long buildingId, int floorNumber) {
        List<Long> floorIds = jdbc.query("""
                        SELECT floor_id FROM floors WHERE building_id = :buildingId AND floor_number = :floorNumber
                        """, Map.of("buildingId", buildingId, "floorNumber", floorNumber),
                (rs, rowNum) -> rs.getLong("floor_id"));
        if (floorIds.isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy tầng thuộc tòa nhà đã chọn.");
        }
        return floorIds.get(0);
    }

    private long findRoomTypeId(String typeCode) {
        List<Long> typeIds = jdbc.query("SELECT room_type_id FROM room_types WHERE type_code = :typeCode",
                Map.of("typeCode", typeCode.trim()), (rs, rowNum) -> rs.getLong("room_type_id"));
        if (typeIds.isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy loại phòng.");
        }
        return typeIds.get(0);
    }

    private void ensureRoomExists(long id) {
        ensureExists("SELECT COUNT(*) FROM rooms WHERE room_id = :id", id, "Không tìm thấy phòng.");
    }

    private void ensureBuildingExists(long id) {
        ensureExists("SELECT COUNT(*) FROM buildings WHERE building_id = :id", id, "Không tìm thấy tòa nhà.");
    }

    private void ensureEquipmentExists(long id) {
        ensureExists("SELECT COUNT(*) FROM equipment WHERE equipment_id = :id", id, "Không tìm thấy thiết bị.");
    }

    private void ensureExists(String sql, long id, String message) {
        Integer count = jdbc.queryForObject(sql, Map.of("id", id), Integer.class);
        if (count == null || count == 0) {
            throw new ResourceNotFoundException(message);
        }
    }

    private MapSqlParameterSource roomParameters(RoomUpsertRequest request) {
        return new MapSqlParameterSource()
                .addValue("roomCode", request.roomCode().trim())
                .addValue("capacity", request.capacity())
                .addValue("status", request.status());
    }

    private long parseId(String value, String prefix, String resourceName) {
        if (value == null || !value.startsWith(prefix)) {
            throw new ResourceNotFoundException("Mã " + resourceName + " không hợp lệ.");
        }
        try {
            long id = Long.parseLong(value.substring(prefix.length()));
            if (id < 1) {
                throw new NumberFormatException("ID phải lớn hơn 0.");
            }
            return id;
        } catch (NumberFormatException ex) {
            throw new ResourceNotFoundException("Mã " + resourceName + " không hợp lệ.");
        }
    }

    private void validatePage(int page, int limit) {
        if (page < 1 || limit < 1 || limit > 100) {
            throw new IllegalArgumentException("page phải từ 1 và limit phải từ 1 đến 100.");
        }
    }

    private static class RoomRow {
        private final long id;
        private final String roomCode;
        private final long buildingId;
        private final String buildingName;
        private final int floorNumber;
        private final int capacity;
        private final String status;
        private final String roomTypeCode;
        private final List<EquipmentResponse> equipments = new ArrayList<>();

        private RoomRow(long id, String roomCode, long buildingId, String buildingName, int floorNumber,
                        int capacity, String status, String roomTypeCode) {
            this.id = id;
            this.roomCode = roomCode;
            this.buildingId = buildingId;
            this.buildingName = buildingName;
            this.floorNumber = floorNumber;
            this.capacity = capacity;
            this.status = status;
            this.roomTypeCode = roomTypeCode;
        }

        private ManagedRoomResponse toResponse() {
            return new ManagedRoomResponse("ROOM-" + id, roomCode, buildingId, buildingName, floorNumber,
                    capacity, status, roomTypeCode, List.copyOf(equipments));
        }
    }

    private record RoomLine(long roomId, String roomCode, long buildingId, String buildingName,
                            int floorNumber, int capacity, String status, String roomTypeCode,
                            Long equipmentId, String equipmentName, String equipmentType,
                            String equipmentStatus) {
    }
}
