using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeridianPlatform.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddShipmentAndLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Locations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    AddressLine1 = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    AddressLine2 = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    State = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PostalCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Locations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Shipments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    OriginLocationId = table.Column<Guid>(type: "uuid", nullable: true),
                    DestinationLocationId = table.Column<Guid>(type: "uuid", nullable: true),
                    WeightKg = table.Column<decimal>(type: "numeric", nullable: true),
                    LengthCm = table.Column<decimal>(type: "numeric", nullable: true),
                    WidthCm = table.Column<decimal>(type: "numeric", nullable: true),
                    HeightCm = table.Column<decimal>(type: "numeric", nullable: true),
                    FreightClass = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    IsHazmat = table.Column<bool>(type: "boolean", nullable: false),
                    HazmatUnNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    HazmatPackingGroup = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    HazmatEmergencyContact = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ServiceLevel = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Shipments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Shipments_Locations_DestinationLocationId",
                        column: x => x.DestinationLocationId,
                        principalTable: "Locations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Shipments_Locations_OriginLocationId",
                        column: x => x.OriginLocationId,
                        principalTable: "Locations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Locations_OwnerId",
                table: "Locations",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_DestinationLocationId",
                table: "Shipments",
                column: "DestinationLocationId");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_OriginLocationId",
                table: "Shipments",
                column: "OriginLocationId");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_OwnerId_Status",
                table: "Shipments",
                columns: new[] { "OwnerId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Shipments");

            migrationBuilder.DropTable(
                name: "Locations");
        }
    }
}
