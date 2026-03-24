import obd, json, asyncio

connection = obd.OBD(
    portstr="socket://localhost:35000",
    baudrate=38400,
    protocol=None,
    fast=False,
    timeout=30,
    check_voltage=False
)


async def performance():
    # RPM (Engine RPM) Rotação do motor por minuto.
    # SPEED (Vehicle Speed) Velocidade atual do veículo.
    # ENGINE_LOAD (Calculated Engine Load) Indica quanto do torque total o motor está usando.
    # THROTTLE_POS (Throttle Position): Abertura do pedal do acelerador/borboleta.
    while True:
        data = {}
        rpm     = connection.query(obd.commands.RPM)
        speed   = connection.query(obd.commands.SPEED)
        throttle_pos = connection.query(obd.commands.THROTTLE_POS)
        engine_load    = connection.query(obd.commands.ENGINE_LOAD)

        data["rpm"]     = rpm.value.magnitude     if not rpm.is_null()     else None
        data["speed"]   = speed.value.magnitude   if not speed.is_null()   else None
        data["throttle_pos"] = throttle_pos.value.magnitude if not throttle_pos.is_null() else None
        data["engine_load"]    = engine_load.value.magnitude    if not engine_load.is_null()    else None
        yield f"data: {json.dumps(data)}\n\n"
        await asyncio.sleep(0.5)

async def saude():
    # COOLANT_TEMP (Engine Coolant Temperature) Temperatura do fluido de arrefecimento.
    # INTAKE_TEMP (Intake Air Temp) Temperatura do ar que entra no motor.
    # MAF (Air Flow Rate) Quantidade de ar que entra no motor (gramas por segundo).
    # INTAKE_PRESSURE (Intake Manifold Pressure) Pressão no coletor de admissão.
    while True:
        data = {}
        coolant_temp     = connection.query(obd.commands.COOLANT_TEMP)
        intake_temp   = connection.query(obd.commands.INTAKE_TEMP)
        maf = connection.query(obd.commands.MAF)
        intake_pressure    = connection.query(obd.commands.INTAKE_PRESSURE)

        data["coolant_temp"]     = coolant_temp.value.magnitude     if not coolant_temp.is_null()     else None
        data["intake_temp"]   = intake_temp.value.magnitude   if not intake_temp.is_null()   else None
        data["maf"] = maf.value.magnitude if not maf.is_null() else None
        data["intake_pressure"]    = intake_pressure.value.magnitude    if not intake_pressure.is_null()    else None
        yield f"data: {json.dumps(data)}\n\n"
        await asyncio.sleep(0.5)