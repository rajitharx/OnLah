using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnLah.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBusNetwork : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BusRoutes",
                columns: table => new
                {
                    ServiceNo = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Direction = table.Column<int>(type: "integer", nullable: false),
                    StopSequence = table.Column<int>(type: "integer", nullable: false),
                    BusStopCode = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false),
                    Operator = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Distance = table.Column<double>(type: "double precision", nullable: false),
                    WdFirst = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: false),
                    WdLast = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: false),
                    SatFirst = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: false),
                    SatLast = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: false),
                    SunFirst = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: false),
                    SunLast = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusRoutes", x => new { x.ServiceNo, x.Direction, x.StopSequence });
                });

            migrationBuilder.CreateTable(
                name: "BusServices",
                columns: table => new
                {
                    ServiceNo = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Direction = table.Column<int>(type: "integer", nullable: false),
                    Operator = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Category = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    OriginCode = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false),
                    DestinationCode = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false),
                    AmPeakFreq = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    AmOffpeakFreq = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    PmPeakFreq = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    PmOffpeakFreq = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    LoopDesc = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusServices", x => new { x.ServiceNo, x.Direction });
                });

            migrationBuilder.CreateIndex(
                name: "IX_BusRoutes_ServiceNo",
                table: "BusRoutes",
                column: "ServiceNo");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BusRoutes");

            migrationBuilder.DropTable(
                name: "BusServices");
        }
    }
}
